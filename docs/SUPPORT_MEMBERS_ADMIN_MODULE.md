# Administración de personal de soporte — Paso 9

## Acceso y endpoints

`/admin/support-members`, `/new`, `/{id}` y `/{id}/edit` son ADMIN-only mediante `RoleGuard`; Express sigue siendo la autoridad. El módulo administra únicamente usuarios con roles SUPPORT y SUB_MANAGER.

- `GET /api/v1/support-members`: filtros documentados `page`, `pageSize`, `search`, `role` (`SUPPORT | SUB_MANAGER`), `supportArea` (enum de cuatro áreas) y `active` (`"true" | "false"`). Activos por defecto; respuesta paginada con `page`, `pageSize`, `total`, `totalPages`.
- `POST /api/v1/support-members`
- `GET /api/v1/support-members/{id}`: incluye inactivos.
- `PATCH /api/v1/support-members/{id}`
- `DELETE /api/v1/support-members/{id}`

La tabla desktop y las tarjetas móviles consumen filtros y paginación del servidor; búsqueda, rol, área, estado, tamaño de página y página se reflejan en URL/query.

## Schemas y campos

`SupportMemberListItem`: `id`, `fullName`, `email`, `institutionalId`, `communityType`, `role`, `supportAreas`, `skills`, `isActive`, `googleLinked` y `lastLoginAt`. `SupportMember` agrega `createdAt` y `updatedAt`; no se muestra `googleSubject`.

`CreateSupportMemberRequest` requiere `fullName`, `email`, `institutionalId`, `communityType`, `role`, `supportAreas` y `skills`. El rol solo puede ser `SUPPORT` o `SUB_MANAGER`; el tipo de comunidad es `STUDENT | TEACHER | ADMINISTRATIVE`, un atributo distinto del rol. Email se valida por formato básico en UI y backend mantiene unicidad.

`PatchSupportMemberRequest` admite únicamente `fullName`, `role`, `supportAreas`, `skills` e `isActive`; el cliente envía solo propiedades dirty. Email, número institucional y tipo de comunidad son read-only en edición. El formulario no crea ni solicita contraseñas, no ofrece ADMIN/USER y no envía invitaciones.

Las áreas se envían como los enums `HARDWARE`, `SOFTWARE`, `NETWORKS`, `ADMINISTRATIVE`; las habilidades son `string[]` y se presentan como etiquetas sin una lista de catálogo. Se eliminan espacios externos, entradas vacías y duplicados exactos al agregar/guardar.

## Preprovisionamiento, OAuth y bajas

El POST preprovisiona la cuenta: `googleSubject` queda null hasta el primer acceso Google OAuth y no se envía invitación. Según contrato funcional, cuando la persona inicia sesión con Google usando el correo preprovisionado, Express enlaza la identidad y conserva rol, áreas y habilidades. Ese enlace no se implementa en frontend.

DELETE es una baja lógica idempotente (204), conserva tickets, bitácoras e identidad Google. El backend la bloquea con 409 si existen tickets OPEN, IN_REVIEW o IN_PROGRESS asignados; la UI conserva el integrante, muestra el mensaje real y permite refetch. No se calculan asignaciones activas desde el cliente.

PATCH permite `isActive`, por lo que la pantalla sí permite reactivar mediante `{ "isActive": true }`. No se expone ninguna propiedad de identidad Google para mutación.

Mutaciones usan `retry: false`. Query keys: `['support-members', 'list', filters]` y `['support-members', 'detail', id]`; creación invalida la lista, edición/baja/reactivación invalidan lista y detalle. No se invalida `/auth/me`.

## Límites conocidos

No se implementa dashboard ADMIN, reportes, asignación administrativa/prioridad de tickets, bootstrap de ADMIN ni funciones backend. `/support-members` no se usa desde SUB_MANAGER: la creación de bitácora de ese rol sigue bloqueada porque falta una fuente de participantes autorizada para ese rol. La primera cuenta ADMIN debe provisionarse por operación/backend, no desde este módulo.
