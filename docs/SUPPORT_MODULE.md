# Módulo SUPPORT — Paso 6

## Alcance

- `/dashboard` presenta el dashboard SUPPORT de la sesión, las métricas
  entregadas por backend, áreas configuradas y `priorityTickets`.
- `/tickets` comparte las queries, filtros, tabla y tarjetas del módulo de
  tickets. La respuesta paginada se limita al conjunto visible por backend.
- `/tickets/[id]` reutiliza el detalle y cronología. Solo el rol SUPPORT puede
  ver las acciones; la UI también exige coincidencia de área y asignación real.
- `/profile` sigue usando el formulario compartido. Role, áreas y skills no son
  editables por este módulo.

Los placeholders SUB_MANAGER/ADMIN permanecen. No se implementa bitácora,
inventario, reportes, administración ni asignación a terceros.

## Contrato usado

Tipos derivados de `src/types/api.generated.ts`:

- `SupportDashboardResponse.data`: `stats` (`unassigned`, `mine`,
  `highPriority`, `completedToday`) y `priorityTickets`.
- `TicketListItem` para cola/tabla/tarjetas, incluido `assignee` cuando está
  disponible; `PaginatedTicketsResponse.meta` conserva página, tamaño, total y
  páginas.
- `TicketDetail`, `TicketEvent`, `TicketAssignmentResult`, `TicketStatusInput`
  y `TicketStatusResult` para detalle, cronología y mutaciones.
- Las áreas se derivan de `Category.supportArea`; `User.supportAreas` está
  generado como `string[]`, por lo que se valida contra el enum derivado antes
  de mostrar etiquetas u opciones.

Endpoints consumidos:

- `GET /api/v1/dashboard`
- `GET /api/v1/tickets`
- `GET /api/v1/tickets/{id}` y `GET /api/v1/tickets/{id}/events`
- `POST /api/v1/tickets/{id}/assign-self` con `{}` (sin `assigneeId`)
- `PATCH /api/v1/tickets/{id}/status` con `TicketStatusInput` y el header
  `Idempotency-Key`
- `GET /api/v1/catalog/ticket-form` solo para opciones reales de categoría y
  subcategoría de filtros

La cola usa filtros que existen en OpenAPI: `search`, `status`, `priority`,
`categoryId`, `subcategoryId`, `assignment` (`mine`, `unassigned`, `assigned`),
`supportArea`, `sort`, `order`, `page` y `pageSize`. La paginación usa el `meta`
real. No se filtra localmente por `supportAreas` como autorización; el servidor
aplica el alcance y las áreas configuradas se usan para contexto y UX.

No se consume `/catalog/support-suggestions`: su propósito de contrato es
devolver sugerencias asociadas a categoría/subcategoría, sin un flujo claro de
atención técnica en este paso. Se mantiene fuera del alcance.

## Autoasignación y estados

“Tomar ticket” aparece solo para un ticket sin asignar, no terminal y de un área
configurada. El backend mantiene la protección de concurrencia y emite el evento
`ASSIGNED`; no se inserta evento optimista. Éxito invalida `['tickets']`, detalle,
eventos y `['dashboard']`. Mutations usan `retry: false`; ante 409 se conserva el
mensaje/request ID real y se ofrece volver a consultar.

Los controles de estado aparecen solo si el `assignee.id` coincide con
`currentUser.id`, la categoría pertenece a las áreas actuales y el ticket no es
terminal. Un ticket asignado a otro técnico es read-only. La UI ofrece las
transiciones de UX documentadas para SUPPORT: `OPEN → IN_REVIEW`, `OPEN →
IN_PROGRESS`, `OPEN → CANCELLED`, `IN_REVIEW → IN_PROGRESS`, `IN_REVIEW →
CANCELLED`, `IN_PROGRESS → COMPLETED` y `IN_PROGRESS → CANCELLED`. El servidor
sigue siendo la autoridad final. `COMPLETED` y `CANCELLED` son terminales.

`TicketStatusInput.note` es opcional en el schema, pero OpenAPI lo marca como
obligatorio al cancelar; la UI lo valida. Completar/cancelar requiere
confirmación. Cada intento PATCH crea una `crypto.randomUUID()` distinta y la
misma clave se usa únicamente para esa solicitud; no se envía en GET ni en
autoasignación. Los botones se bloquean durante el intento y mutation retry está
desactivado.

## Responsive, pruebas y límites

Se reutilizan `MetricCard`, `TicketListItems`, `StatusBadge`, `PriorityBadge`,
`TicketTimeline`, `ConfirmDialog`, `EmptyState`, `ErrorState` y el formateador
`es-MX`/`America/Tijuana`. Lista y cola cambian a tarjetas en móvil.

Pruebas cubren métricas/cola/estados de carga, filtros y paginación,
autoasignación, 409/concurrencia, payload de estado, idempotencia, nota de
cancelación, terminales y regresión USER/roles aplazados.

La especificación todavía tipa `TicketDetail.status`, `priority`,
`category.supportArea` y `User.supportAreas` de forma más amplia que sus enums de
dominio. La UI guarda contra valores desconocidos; el backend valida permisos y
transiciones. No se realizó una prueba manual porque no hay una sesión SUPPORT
real disponible en este entorno.
