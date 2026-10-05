# Administración de categorías — Paso 9

## Acceso y API

`/admin/categories` y todas sus acciones están protegidas por el `RoleGuard` ADMIN-only. La API Express conserva autorización real. La pantalla llama a:

- `GET /api/v1/categories?includeInactive=true`: incluye categorías inactivas solo para ADMIN; las subcategorías inactivas se excluyen de la respuesta.
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/{id}`
- `DELETE /api/v1/categories/{id}`
- `POST /api/v1/categories/{categoryId}/subcategories`
- `PATCH /api/v1/subcategories/{id}`
- `DELETE /api/v1/subcategories/{id}`

El schema `Category` del OpenAPI generado contiene `id`, `code`, `name`, `supportArea`, `defaultPriority`, `requiresSoftwareDetails`, `isActive` y `subcategories`. `supportArea` es `HARDWARE | SOFTWARE | NETWORKS | ADMINISTRATIVE`; `defaultPriority` es `LOW | MEDIUM | HIGH | null`. `Subcategory` contiene `id`, `categoryId?`, `code`, `name`, `priority` nullable e `isActive`.

## Payloads y prioridad

`CreateCategoryInput`: `code`, `name`, `supportArea`, `requiresSoftwareDetails` obligatorios; `defaultPriority` opcional y nullable. La UI envía explícitamente boolean y prioridad (`null` para “Sin prioridad predeterminada”). El contrato indica que el código técnico es UPPER_SNAKE_CASE y estable; solo creación permite editarlo.

`UpdateCategoryInput` es PATCH parcial: `name`, `supportArea`, `defaultPriority`, `requiresSoftwareDetails`, `isActive`. No envía `code`, `id` ni timestamps; solo propiedades dirty.

`CreateSubcategoryInput`: `code`, `name` y `priority?` nullable. `UpdateSubcategoryInput`: `name?`, `priority?` nullable e `isActive?`; código y categoría no son editables. El `categoryId` de creación se envía en la ruta, no se duplica en el body.

Cuando `Subcategory.priority` es `null`, la interfaz indica que se usa la prioridad predeterminada de la categoría. La prioridad efectiva del ticket (subcategoría o categoría) la calcula el servidor; la interfaz administrativa solo configura los valores soportados. `requiresSoftwareDetails` se controla directamente, sin inferirlo del nombre.

## Bajas y límites

Ambos DELETE son baja lógica idempotente con respuesta 204. Desactivar una categoría no desactiva sus subcategorías ni borra datos históricos. La confirmación describe exactamente ese comportamiento. No se hace cascade ni actualización optimista de la lista; se invalida/refresca después del resultado del servidor. El contrato permite cambiar `isActive` por PATCH en categorías. El endpoint de categorías no devuelve subcategorías inactivas, por lo que no hay flujo de reactivación de subcategoría en esta pantalla.

Conflictos y errores de validación muestran el mensaje real de la API, errores por campo cuando están disponibles y `requestId`. Mutaciones usan `retry: false`.

## Caché y catálogo USER

Query key de administración: `['categories', filters]` (invalidación por prefijo `['categories']`). Cada creación, edición o baja de categoría/subcategoría invalida además `['catalog', 'ticket-form']`, que corresponde a `GET /api/v1/catalog/ticket-form`. El módulo USER obtiene los datos actuales en su siguiente consulta; no hay catálogo hardcodeado ni sincronización local.
