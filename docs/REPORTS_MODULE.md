# Reportes de actividad — Paso 11

`/reports` es ADMIN-only por el `RoleGuard` existente. Es una vista de solo
lectura que consume `GET /api/v1/reports/activity`; no usa el endpoint de
tickets para fabricar agregados ni agrega exportación. TanStack Query usa
`['reports', 'activity', filters]`, stale time de 30 segundos y no hace polling.

## Filtros y periodo

El contrato requiere `from` y `to` en formato date-only `YYYY-MM-DD`, con
`to >= from`. Permite además `supportArea`, `categoryId` y `technicianId`; no se
envían otros parámetros. Filtros aplicados quedan en el URL y sobreviven al
refresh/back/forward. En una visita sin rango se usa el mes calendario actual
desde el día 1 hasta hoy en `America/Tijuana`, y se canoniza el rango en el URL.
Limpiar filtros vuelve a ese periodo y quita área/categoría/técnico.

Los valores `input[type=date]` se mantienen como strings de fecha calendario:
no se convierten a `Date` ni a ISO timestamp. El backend interpreta ambos
extremos como fechas locales inclusivas en `APP_TIMEZONE=America/Tijuana` y los
convierte a un intervalo UTC semiabierto. Se validan fechas gregorianas y
`from <= to` antes de consultar; un rango invertido no dispara request.

Área usa el enum OpenAPI. Categorías provienen de la query existente
`GET /api/v1/categories` y el selector no hardcodea el catálogo. Para técnicos
se reutiliza `GET /api/v1/support-members`, filtrando por ambos roles y ambos
estados activo/inactivo, con tamaño 100 por página y búsqueda server-side bajo
demanda. Esto evita omitir del selector a un técnico inactivo que aparezca en
agregados históricos; si la lista excede el tamaño, el buscador permite acotarla.
La query vive en la vista ADMIN; no se usa para la Bitácora SUB_MANAGER.

## Respuesta y semántica

`ActivityReportResponse.data` contiene `summary`, `byCategory`,
`byTechnician` y `daily`:

- `summary.ticketsCreated`: tickets cuya creación cae en el periodo.
- `summary.ticketsCompleted`: tickets completados en el periodo por
  `completedAt`, incluso si fueron creados antes.
- `summary.pending`: tickets creados en el periodo que permanecen activos
  actualmente; no representa todos los tickets pendientes existentes.
- `summary.averageResolutionMinutes`: duración promedio backend de los tickets
  completados en el periodo, en minutos. El frontend solo la formatea; por
  ejemplo, 45 → `45 min`, 90 → `1 h 30 min`, 1500 → `1 d 1 h`.
- `byCategory[]`: `categoryId`, label `category` y `count`.
- `byTechnician[]`: `technicianId`, `name`, `completed` y `active`.
- `daily[]`: fecha date-only local `date`, `created` y `completed`. OpenAPI
  documenta que incluye días sin actividad con ceros.

Todos los conteos y promedios provienen del endpoint; no se recalculan desde
arrays parciales. Categorías se representan con barras CSS de una sola serie y
valor visible; técnicos con tarjetas comparativas; la serie diaria con dos
series, barra y valor numérico por fila. Cada sección incluye encabezado y
descripción textual; la gráfica no es la única representación de los datos.
Las fechas `daily.date` se muestran como componentes date-only (`dd/mm/yyyy`),
sin parsear/reagrupar por UTC. No se añadió dependencia de gráficas ni se hacen
consultas por cada categoría o técnico (sin N+1).

Summary muestra los ceros explícitos del backend. Si todos los agregados están
en cero, se presenta «No hay actividad para los filtros seleccionados» en vez
de gráficos vacíos. Loading mantiene filtros visibles y muestra skeletons; los
errores de reporte muestran ErrorState, reintento y `requestId` si está
disponible. Fallos de catálogo de categorías o personal se limitan al selector
afectado. No hay mutations, exportación PDF/Excel/CSV, WebSockets ni polling.
