# Dashboard administrativo — Paso 11

`/dashboard` conserva una sola ruta y elige la vista según `user.role`. ADMIN
consulta `GET /api/v1/dashboard`; el backend deriva el rol de la sesión y entrega
los agregados globales. No se agrega `role` a la query ni se reconstruyen
métricas con otros endpoints.

## Respuesta OpenAPI

`AdminDashboardResponse.data` contiene:

- `stats.activeTickets`: cantidad de tickets activos definida por backend.
- `stats.unassigned`: tickets sin asignar, según el agregado backend.
- `stats.activeTechnicians`: personal técnico activo, sin sumar consultas de
  `/support-members` en el cliente.
- `stats.inventoryItems`: cantidad de elementos reportada por el backend. El
  schema OpenAPI no especifica si incluye elementos inactivos; la UI no presume
  ese criterio.
- `technicianWorkload[]`: `userId`, `name`, `supportAreas`, `activeTickets` y
  `completedToday`.

Las cuatro estadísticas se presentan con `MetricCard` y formato numérico
`es-MX`. La tabla de carga compara tickets activos y completados hoy; en móvil
se transforma en tarjetas con los mismos valores textuales. Las áreas usan sus
labels institucionales. No hay solicitudes N+1 ni una agregación local de
técnicos. `completedToday` sigue la zona `APP_TIMEZONE` del backend.

Loading usa placeholders de métricas/carga; los errores muestran mensaje,
`requestId` si existe y reintento. Una carga vacía presenta un `EmptyState`, sin
inventar filas. No se instaló librería de gráficas: las métricas y tabla
responsive cubren la comparación y mantienen una alternativa textual accesible.

El dashboard usa query key `['dashboard']`, stale time de 30 segundos y la
política de reintentos común. USER y SUPPORT/SUB_MANAGER conservan sus vistas
existentes; el endpoint responde según la sesión autenticada.
