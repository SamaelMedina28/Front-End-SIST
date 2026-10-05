# Módulo de bitácora — Paso 7

## Roles y rutas

- `SUPPORT`: consulta `/activity-log` y `/activity-log/{id}`; no ve acciones de escritura ni historial.
- `SUB_MANAGER`: consulta, abre detalle, edita mediante PATCH y consulta revisiones; ve la acción para registrar.
- `ADMIN`: lectura y revisiones a través de las vistas compartidas. No se agregan controles de escritura ni módulos administrativos en este paso.
- `USER`: permanece fuera de las rutas protegidas de bitácora.

Express mantiene la autorización definitiva. El frontend no filtra resultados de otro rol/área como control de seguridad.

## API y consultas

Se usan los esquemas OpenAPI generados `ActivityLogListItem`, `ActivityLogDetail`, `ActivityLogRevision`, `ActivityLogCreateRequest`, `ActivityLogPatchRequest` y `PaginatedActivityLogsResponse`.

- `GET /api/v1/activity-log`: parámetros reales `page`, `pageSize`, `ticketId`, `technicianId`, `status`, `search`, `from`, `to`. La vista expone búsqueda, ticketId, estado y rango de fechas; no muestra technicianId hasta contar con un selector autorizado.
- `GET /api/v1/activity-log/{id}`: detalle y snapshots.
- `PATCH /api/v1/activity-log/{id}`: solo campos editables del esquema parcial; no envía ticketId.
- `GET /api/v1/activity-log/{id}/history`: solo SUB_MANAGER y ADMIN en la interfaz.
- `POST /api/v1/activity-log`: el contrato requiere ticketId, activity, participantIds, serviceStartedAt, timeSpentMinutes y status; serviceEndedAt admite ausencia o null. El alta SUB_MANAGER envía IDs devueltos por el catálogo autorizado; el backend conserva la validación definitiva.
- `GET /api/v1/catalog/activity-log-participants?ticketId=...`: candidatos activos para un ticket existente; respuesta tipada `ActivityLogParticipantCandidate[]`. La consulta cambia con ticketId y no usa `/support-members`.

La API aplica el scope de áreas a SUPPORT/SUB_MANAGER. `requestApiEnvelope` conserva `meta` para la paginación real. El detalle usa los snapshots del response (ticket, falla y reportero) y no consulta datos actuales para reconstruir el pasado.

El detalle del ticket ofrece un enlace `Ver bitácora` usando el filtro real `ticketId`; SUB_MANAGER también obtiene el acceso a registrar actividad con el ticket preseleccionado.

## Participantes y creación

El formulario de creación es solo para SUB_MANAGER, admite un `ticketId` preseleccionado o editable y consulta el catálogo autorizado al cambiarlo. Permite seleccionar uno o más candidatos y envía sus IDs reales en `participantIds`; si no hay candidatos, la consulta falla o no hay selección, no permite POST. Un cambio de ticket limpia selecciones anteriores y el backend sigue siendo autoridad para validar elegibilidad. `/support-members` permanece ADMIN-only y no se consume. SUPPORT conserva la experiencia read-only. Las mutaciones POST no se reintentan y al éxito invalidan lista, detalle e historial relacionados.

## Fechas, duración y estado

Los estados aceptados son `IN_PROGRESS` y `COMPLETED`, con labels “En proceso” y “Finalizado”. Los campos `datetime-local` de edición se interpretan explícitamente como `America/Tijuana` y se convierten a ISO UTC; las fechas de lectura se formatean en `es-MX` / `America/Tijuana`. Se rechazan horas locales inexistentes durante el salto DST. El schema revisado no declara una regla de orden entre inicio y fin, así que no se impone esa validación. `timeSpentMinutes` se captura como campo explícito; no se deriva del intervalo. No se añaden límites que el schema OpenAPI no documenta.

## Edición e historial

PATCH se construye solo con campos dirty y autorizados por `ActivityLogPatchRequest`. No se envía el objeto completo ni ticketId. Los participantes existentes siguen de solo lectura en edición. Un 409 informa el conflicto y se pide revisar la versión más reciente; Query invalida lista, detalle e historial al guardar. La revisión es inmutable; la UI compara únicamente los campos conocidos y omite cualquier campo nuevo sin renderizar JSON crudo.

## UX y errores

El listado tiene tabla desde breakpoint md y cards móviles, filtros serializados en URL, estados loading/error/empty y paginación del servidor. Las queries usan `['activity-log', filters]`, `['activity-log', id]` y `['activity-log', id, 'history']`; las mutaciones no reintentan automáticamente. Errores conservan mensaje y `requestId` cuando se presenta.

La validación manual con sesiones reales de SUPPORT/SUB_MANAGER queda pendiente si esas sesiones no están disponibles en el entorno.
