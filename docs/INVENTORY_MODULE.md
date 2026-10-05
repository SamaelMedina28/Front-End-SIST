# Módulo de inventario

## Alcance

Interfaz disponible por RBAC a `SUB_MANAGER` y `ADMIN` mediante la ruta `/inventory`. La API sigue siendo la autoridad de autorización. Ambos roles comparten el mismo módulo. No se incluye administración de participantes, reactivación, ni otras funciones fuera del Paso 8.

## Capacidades

- Listado paginado desde `GET /api/v1/inventory`, búsqueda, filtros de tipo/edificio/estado y tamaño de página en la URL. El endpoint devuelve activos por defecto; se ofrece un filtro explícito de inactivos. Escritorio usa tabla y móvil usa tarjetas.
- Alta mediante `POST /api/v1/inventory`, con esquema discriminado por tipo. El formulario borra valores al cambiar el tipo y el mapper solo construye el payload del tipo activo. Computadoras/proyectores envían `quantity: 1`; controles/adaptadores requieren entero >= 1. Los límites restantes los aplica el backend y no se inventan límites máximos.
- Detalle mediante `GET /api/v1/inventory/{id}`, incluso para artículos inactivos; edición con `PATCH` parcial. El tipo es inmutable y se envían exclusivamente campos modificados permitidos. El contrato no indica que PATCH esté prohibido sobre artículos inactivos, por lo que la interfaz permite editar sus atributos y no permite activar/desactivar desde el formulario.
- Desactivación confirmada mediante `DELETE /api/v1/inventory/{id}`. Es soft-delete idempotente; la interfaz lo presenta como “Desactivar”, conserva el acceso al detalle y al historial y no ofrece reactivación porque no existe endpoint documentado.
- Historial paginado por artículo mediante `GET /api/v1/inventory/{id}/tickets`, con filtros por estado y fecha de creación (`from`/`to`). Incluye categoría/subcategoría, prioridad, estado, código, fechas y nombre de solicitante de la instantánea reportada por el backend. No consulta la lista global de tickets.

## Contrato y errores

Los tipos de requests/responses provienen de `src/types/api.generated.ts`, generado con `pnpm generate:api`; no editar ese archivo a mano. El módulo usa el cliente `openapi-fetch` compartido, `requestApi`/`requestApiEnvelope`, TanStack Query y `ApiError`. Las mutaciones no se reintentan automáticamente. Los errores muestran el mensaje de la API, errores de campo cuando vienen en 422, y `requestId` cuando está disponible. La respuesta 409 se presenta como conflicto. 401/403 siguen el manejo común de sesión/roles y 404 se muestra como recurso inexistente.

## Verificación manual sugerida

Con la API conectada, comprobar listado con filtros y páginas, alta de los cuatro tipos, conflictos de códigos únicos, edición limitada al PATCH, desactivación y repetición idempotente, detalle e historial de elemento inactivo, fechas inclusivas según contrato del servidor, errores 401/403/404/409/422, y navegación en viewport móvil. Esta verificación requiere una sesión y datos de API disponibles.
