# Administración global de tickets — Paso 10

La ruta compartida `/tickets` usa el alcance global que el API entrega a ADMIN;
el cliente no descarga todo el conjunto ni aplica filtros locales como control
de autorización. `/tickets/[id]` conserva el mismo detalle y timeline para todos
los roles; solo ADMIN recibe el panel administrativo.

## Contrato y filtros

El cliente OpenAPI se regeneró desde `GET /api/openapi.json`. `GET
/api/v1/tickets` documenta que USER ve sus tickets, SUPPORT/SUB_MANAGER ven sus
áreas y ADMIN ve todos. La interfaz ADMIN usa los parámetros reales: `search`,
`status`, `priority`, `categoryId`, `subcategoryId`, `assignment`
(`unassigned | assigned`), `assignedTo` (id), `supportArea`, `createdFrom`,
`createdTo`, `sort`, `order`, `page` y `pageSize`. No envía restricciones de
usuario o áreas propias. Estado, prioridad, categorías, área, asignación,
técnico, fecha y sorting se consultan en servidor. Cambiar filtros reinicia la
página a 1; los botones de paginación conservan filtros y usan `meta` del API.

El control de fechas permite un día calendario y lo convierte a instantes ISO
UTC inclusivos: inicio `00:00:00.000Z` y fin `23:59:59.999Z`. No se aplican
conversiones de zona horaria locales adicionales.

## Técnico elegible

El detalle consulta `GET /api/v1/support-members` por cada rol admitido
(`SUPPORT`, `SUB_MANAGER`) con `active=true`, `supportArea` de la categoría,
página 1, tamaño 100 y búsqueda server-side. Se excluyen defensivamente miembros
inactivos e incompatibles con el área; las skills son solo información auxiliar.
El servidor mantiene la autoridad final sobre elegibilidad y concurrencia. El
selector de técnicos del filtro global usa la misma API y búsqueda por nombre.

No se usa `GET /api/v1/catalog/support-suggestions`: su contrato devuelve
sugerencias `{id, title, description}` para orientar al solicitante, no cuentas
ni identificadores de personal asignable. `/support-members` sí es la fuente
autorizada para candidatos y está disponible solo para ADMIN.

## Acciones administrativas

- Asignar o reasignar: `PUT /api/v1/tickets/{id}/assignee`, body
  `{ assigneeId }`. Reasignar es un único PUT; la opción del asignado actual se
  deshabilita para evitar un no-op.
- Desasignar: `DELETE /api/v1/tickets/{id}/assignee`, con confirmación explícita
  «El ticket quedará sin técnico asignado.»
- Prioridad: `PATCH /api/v1/tickets/{id}/priority`, body
  `{ priority, reason }`. La razón no vacía es obligatoria según OpenAPI. No se
  envía la operación si la prioridad no cambia. Tickets terminales no ofrecen
  asignación, desasignación ni cambio de prioridad: el contrato limita esas
  operaciones a tickets activos.
- Estado: `PATCH /api/v1/tickets/{id}/status`; ADMIN puede cambiar cualquier
  ticket sin requisito de asignación propia. Se ofrece el mismo grafo UX usado
  por SUPPORT: `OPEN → IN_REVIEW | IN_PROGRESS | CANCELLED`,
  `IN_REVIEW → IN_PROGRESS | CANCELLED`, e
  `IN_PROGRESS → COMPLETED | CANCELLED`. Se confía en el backend como validador
  final. `COMPLETED` y `CANCELLED` son terminales. Completar/cancelar requieren
  confirmación y cancelar requiere nota.

Los cambios generan eventos en el backend. No se insertan eventos optimistas ni
se gestiona `NotificationOutbox` desde el cliente. La actividad usa el
`TicketTimeline` compartido con `GET /api/v1/tickets/{id}/events`.

## Caché, concurrencia y errores

Las mutaciones no reintentan automáticamente. Cambios correctos invalidan
`['tickets']`, `['tickets', id]`, `['tickets', id, 'events']` y
`['dashboard']`. Los conflictos 409 también invalidan esas claves para volver a
leer el resultado autoritativo; la interfaz conserva el mensaje real del API y
ofrece reconsulta explícita. El cambio de estado conserva `Idempotency-Key` y
reutiliza la misma función del módulo SUPPORT. Asignación, desasignación y
prioridad no envían esa cabecera.

Los errores de consulta y mutación son locales a la sección correspondiente;
403/404/409/422 y fallos de red/5xx se muestran sin ocultar el resto del detalle.
Se presenta `requestId` cuando está disponible. No hay locks frontend ni
actualizaciones optimistas.

## Roles, layout y límites

USER conserva su listado, creación, detalle e historial sin controles ADMIN.
SUPPORT/SUB_MANAGER conservan filtros y acciones técnicas existentes; no reciben
selector global, desasignación ni prioridad ADMIN. ADMIN recibe filtros globales,
asignación/reasignación, desasignación, prioridad y estado global. La tabla
administrativa se usa en escritorio y el componente compartido pasa a cards en
móvil; el panel de detalle se apila en pantallas angostas.

No se implementan dashboard ADMIN, reportes, métricas, cambios backend,
`participantIds` de bitácora ni el Paso 11. No se probó contra una sesión real
ADMIN. El selector obtiene hasta 100 resultados por rol y búsqueda/área; cuando
la lista excede ese límite, usar búsqueda server-side para acotarla. Las reglas
de elegibilidad/terminalidad siguen perteneciendo al backend.
