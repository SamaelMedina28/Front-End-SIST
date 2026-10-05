# Módulo USER — Paso 5

## Funcionalidad

- `/dashboard`: consume `GET /dashboard`, representa las métricas y tickets
  recientes del contrato USER, con estados de carga, error y vacío.
- `/tickets`: búsqueda, filtros de estado/prioridad/categoría/subcategoría y
  paginación según `meta`; los filtros admitidos se serializan en la URL. El
  listado ofrece tabla amplia y tarjetas en móvil.
- `/tickets/new`: obtiene categorías, subcategorías, prioridades sugeridas y
  reglas del formulario desde `GET /catalog/ticket-form`. Envía únicamente los
  campos de `CreateTicketRequest`; el servidor determina estado/prioridad y
  aplica sus límites y conflictos.
- `/tickets/[id]`: muestra datos de `GET /tickets/{id}` y la cronología ASC de
  `GET /tickets/{id}/events`. Es una vista de solo lectura.
- `/profile`: permite editar solo nombre y teléfono mediante `PATCH /users/me`;
  correo e identificador institucional se muestran como datos no editables.

Los roles de soporte, subgerencia y administración conservan placeholders en las
vistas del dashboard, listado y perfil hasta sus pasos. El detalle reutilizable
permanece de solo lectura. El RoleGuard y Express siguen siendo responsables de
la política y autorización; la interfaz solo orienta y no sustituye controles del
backend.

## Contrato y comportamiento

La lista usa `page`, `pageSize`, `search`, `status`, `priority`, `categoryId`,
`subcategoryId`, `sort`, `order` y, si se reciben en URL, `createdFrom` y
`createdTo`. Parámetros no válidos se descartan. No se agregan filtros por
propietario: el servidor entrega el conjunto permitido para la sesión.

El formulario refleja `maxActiveTickets` y `requiresSoftwareDetails` del catálogo.
Los campos de software solo se habilitan para perfil docente conforme a la
descripción del endpoint. No hay selector de inventario en el contrato USER
disponible. El backend puede responder 409 por restricciones como duplicados o
límite de tickets activos; como OpenAPI no enumera códigos específicos para
esas causas, la interfaz preserva los datos y muestra el mensaje/request ID
devuelto, sin inferir la causa.

La edición de perfil envía exclusivamente `{ fullName, phone }` (el teléfono
vacío se normaliza a `null`) e invalida `['auth', 'me']`. Crear un ticket navega
al identificador devuelto e invalida el dashboard/listado. No se implementan
mutaciones de estado, prioridad o asignación para USER.

## Verificación y límites

Hay pruebas unitarias para filtros, normalización y payloads, además de pruebas
de interfaz para estados de dashboard/listado, formulario y conflictos, detalle,
eventos y edición de perfil. La generación del cliente OpenAPI se mantiene como
parte de las verificaciones.

La especificación tipa `status` y `priority` de `TicketDetail` como strings
genéricos aunque los recursos de listado usan enums; la vista tolera valores
desconocidos sin asumir transiciones. Queda pendiente una pasada manual con una
sesión USER institucional para comprobar el flujo contra datos reales.
