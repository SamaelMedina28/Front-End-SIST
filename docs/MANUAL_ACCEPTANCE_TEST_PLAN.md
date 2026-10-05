# Plan manual de aceptación

Ejecutar con backend, OAuth y cuentas de prueba reales autorizadas por la
institución. No guardar ni compartir credenciales en el repositorio. En local,
frontend `http://localhost:3001`, backend `http://localhost:3000` y
`FRONTEND_URL=http://localhost:3001`; CORS debe admitir credenciales.

## USER

1. Iniciar sesión con Google; confirmar `/auth/success` y, para cuenta nueva,
   completar `/auth/complete-profile` sin que un 401 normal redirija el form.
2. Revisar dashboard, métricas y tickets recientes contra el backend.
3. Crear una solicitud con y sin subcategoría; probar software condicional,
   duplicado/conflicto y límite de 10 solicitudes activas. Confirmar que estado
   y prioridad los determina el servidor.
4. Revisar filtros/paginación, detalle y timeline; confirmar que solo se ven
   tickets autorizados por el backend.
5. Editar nombre/teléfono en perfil; confirmar correo e identificador no
   editables. Cerrar sesión y verificar retorno a login.

## SUPPORT

1. Confirmar dashboard técnico y cola limitada a permisos/áreas del servidor.
2. Probar filtros, paginación, autoasignación y conflicto de asignación.
3. Probar transiciones permitidas, nota obligatoria al cancelar, confirmación
   de estados terminales e idempotencia de PATCH ante doble interacción.
4. Verificar que prioridad y administración no aparezcan; leer bitácora sin
   controles de edición o creación.
5. Revisar perfil y cierre de sesión.

## SUB_MANAGER

1. Comprobar las capacidades técnicas SUPPORT permitidas por el contrato.
2. Leer bitácora, editar una entrada autorizada y consultar su historial.
3. Abrir «Registrar actividad»: debe explicar el bloqueo `participantIds`, no
   enviar POST ni consultar `/support-members` para obtener participantes.
4. Crear, consultar, editar y desactivar inventario; verificar historial,
   campos compatibles por tipo y persistencia de registros inactivos.
5. Confirmar ausencia de prioridad ADMIN y revisar perfil/logout.

## ADMIN

1. Revisar dashboard (métricas y carga) y reportes: periodo, área, categoría,
   técnico, resumen, categorías, técnicos y series diarias.
2. Crear/editar/desactivar categorías y subcategorías; validar catálogo usado
   por creación de tickets.
3. Preprovisionar SUPPORT y SUB_MANAGER, editar/desactivar/reactivar; confirmar
   que nunca se ofrece crear ADMIN/USER ni ingresar contraseñas.
4. Probar CRUD permitido de inventario y desactivación lógica.
5. En tickets globales, probar búsqueda/filtros, asignación, reasignación,
   desasignación, prioridad con motivo y transiciones de estado; verificar
   conflictos y actualización de detalle/timeline.
6. Confirmar acceso a bitácora según el contrato, perfil y logout.

## Cierre transversal

- Abrir rutas no autorizadas directamente: deben ocultar contenido y dirigir a
  `/forbidden`; el backend debe rechazar igualmente solicitudes no autorizadas.
- Probar viewport móvil 390×844, tablet 768×1024 y escritorio 1440×900; validar
  navegación móvil, formularios, foco/teclado, diálogos, overflow y lectura con
  zoom. No usar solo color para interpretar estado.
- Probar origen/credenciales de cookies en HTTPS de staging; no relajar CORS ni
  usar `no-cors` como workaround.

La aceptación real de OAuth, cookies, CORS y permisos por rol queda pendiente
hasta completar este plan con backend y cuentas institucionales provisionadas.
