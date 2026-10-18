# Auditoría final del frontend

Fecha de revisión: 2026-10-05. Alcance: aplicación Next.js/React en este
repositorio y su cliente OpenAPI. Se hizo inspección estática del frontend,
contrato generado, permisos de experiencia, caché, seguridad, documentación y
pruebas. No se modificó Express, Prisma, base de datos ni contrato backend.
No es una prueba de penetración ni sustituye aceptación con sesiones reales.

## Evaluación ejecutiva

El código funcional está implementado para los módulos enumerados, incluida
la creación de bitácora SUB_MANAGER mediante el catálogo backend autorizado de
participantes. Se corrigieron fallos de caché de dashboard,
política fail-closed, acceso al perfil por rol, placeholders de módulos,
documentación obsoleta y errores globales/ruta no encontrada. La ruta de
showcase `/design-system` se retiró. La salida de comandos y el estado final se
registran al terminar esta auditoría.

**CODE READY:** El alcance funcional revisado está implementado y sujeto a
verificaciones automatizadas y aceptación manual; esto no implica producción
lista ni validación operativa.

**OPERATIONALLY VALIDATED:** No. Faltan validación de OAuth/cookies/CORS con
backend real, cuentas por rol, configuración HTTPS/variables de producción y
ejecución del plan manual. No se afirma “production ready”.

## Estado por feature

| Feature | Estado | Alcance / pendiente |
| --- | --- | --- |
| Auth | PENDING MANUAL VALIDATION | OAuth Google, cookies HTTP-only, onboarding y logout integrados; validar con sesión real. |
| USER | PENDING MANUAL VALIDATION | Dashboard, tickets, alta, detalle/timeline y perfil. |
| SUPPORT | PENDING MANUAL VALIDATION | Dashboard, cola, autoasignación, estados y lectura de bitácora. |
| SUB_MANAGER | PENDING MANUAL VALIDATION | Capacidades técnicas, bitácora (incluida creación con participantes autorizados) e inventario. |
| Activity Log | PENDING MANUAL VALIDATION | Lectura, detalle, edición, historial y creación SUB_MANAGER con catálogo de participantes autorizado. SUPPORT permanece read-only. |
| Inventory | PENDING MANUAL VALIDATION | Listado, detalle, historial, alta, edición y desactivación lógica según contrato. |
| Categories | PENDING MANUAL VALIDATION | Administración de categorías/subcategorías, desactivación e invalidación de catálogo. |
| Support Members | PENDING MANUAL VALIDATION | Listado, filtros, alta técnica, detalle, edición, baja/reactivación autorizadas. |
| Admin Tickets | PENDING MANUAL VALIDATION | Listado global, asignación/reasignación/baja, prioridad y estados. |
| Admin Dashboard | PENDING MANUAL VALIDATION | Métricas y carga consumidas desde dashboard global del backend. |
| Reports | PENDING MANUAL VALIDATION | Agregados por rango, área, categoría, técnico y serie diaria del endpoint. |

PENDING MANUAL VALIDATION significa que el código está integrado pero falta
validarlo con backend/datos y rol reales; no equivale a aceptación operativa.

## OpenAPI e inventario de endpoints

`pnpm generate:api` se ejecutó contra el OpenAPI actual de
`http://localhost:3000/api/openapi.json`; el archivo `src/types/api.generated.ts`
incluye el catálogo `ActivityLogParticipantCandidate`.
Los tipos de bodies, filtros, respuestas y paths se derivan de
`components`/`paths`; las comprobaciones runtime solo validan envoltura,
identificadores y metadatos de paginación.

| Grupo | Operaciones consumidas | Uso/rol de interfaz | Datos principales |
| --- | --- | --- | --- |
| AUTH | `GET /auth/me`, `POST /auth/complete-profile`, `POST /auth/logout`; navegación completa a `GET /auth/google` y callback backend | Sesión para todos los roles; onboarding temporal | `User`, `CompleteProfileInput`; logout sin body |
| USER/Profile | `PATCH /users/me` | Todos los autenticados | Body derivado `UpdateUserProfileInput` (nombre/teléfono); respuesta `User` |
| USER/Tickets | `GET /tickets`, `GET /tickets/{id}`, `GET /tickets/{id}/events`, `GET /catalog/ticket-form`, `POST /tickets` | USER; el servidor limita recursos | filtros/paginación OpenAPI; body `CreateTicketRequest`; ticket, eventos y catálogo |
| TICKETS técnico/ADMIN | `GET /tickets`, detalle/eventos; `POST /tickets/{id}/assign-self`; `PATCH /tickets/{id}/status`; `PUT` y `DELETE /tickets/{id}/assignee`; `PATCH /tickets/{id}/priority` | Lista compartida según rol; acciones técnicas/admin limitadas por rol en UI | `TicketFilters`, `TicketStatusInput`, `AdminAssigneeInput`, `TicketPriorityInput`; la prioridad solo ADMIN |
| DASHBOARD | `GET /dashboard` | USER, SUPPORT/SUB_MANAGER y ADMIN; el backend deriva forma/alcance de sesión | `UserDashboardResponse`, `SupportDashboardResponse` o `AdminDashboardResponse` |
| ACTIVITY LOG | `GET /activity-log`, `GET /activity-log/{id}`, `GET /activity-log/{id}/history`, `PATCH /activity-log/{id}` | SUPPORT lectura; SUB_MANAGER lectura/edición; ADMIN conforme al contrato | filtros y `ActivityLogPatchRequest`; listado/detalle/revisiones |
| ACTIVITY LOG create | `GET /catalog/activity-log-participants?ticketId=...`, `POST /activity-log` | Creación solo SUB_MANAGER en UI; SUPPORT read-only | `ActivityLogParticipantCandidate[]`, `ActivityLogCreateRequest`; POST sin retry, `participantIds` reales del catálogo |
| INVENTORY | `GET /inventory`, `GET /inventory/{id}`, `GET /inventory/{id}/tickets`, `POST /inventory`, `PATCH /inventory/{id}`, `DELETE /inventory/{id}` | SUB_MANAGER y ADMIN | `InventoryFilters`, filtros de historial y schemas generados; DELETE es desactivación lógica según contrato/UI |
| CATEGORIES | `GET/POST /categories`, `PATCH/DELETE /categories/{id}`, `POST /categories/{categoryId}/subcategories`, `PATCH/DELETE /subcategories/{id}` | ADMIN | filtros y schemas de categoría/subcategoría OpenAPI; DELETE se presenta como desactivar |
| SUPPORT MEMBERS | `GET/POST /support-members`, `GET/PATCH/DELETE /support-members/{id}` | ADMIN únicamente; altas limitadas a SUPPORT/SUB_MANAGER | filtros paginados y schemas generados; sin password/invitation |
| REPORTS | `GET /reports/activity` | ADMIN únicamente | `from/to` date-only, `supportArea`, `categoryId`, `technicianId`; agregados summary/category/technician/daily |

Los endpoints y métodos del cliente existen en `src/features/*/api.ts` y
coinciden con los paths regenerados. `GET /catalog/support-suggestions` está
en OpenAPI pero no se usa como catálogo de participantes; hacerlo no está
autorizado por el contrato actual. No se recalculan reportes descargando
tickets. El flujo de creación de ticket deja al backend calcular prioridad,
deduplicación y límite concurrente.

### Discrepancias/tipos amplios

- OpenAPI deja ciertos campos deliberadamente como `string`, por ejemplo
  `User.supportAreas` y algunos campos de detalle/revisión. La UI valida áreas
  antes de mapearlas; status/priority desconocidos se representan con fallback
  textual y no habilitan acciones de transición.
- Los enums que sí están definidos (roles, prioridad de request,
  estados de ticket, áreas) se derivan del schema generado; no se mantiene un
  contrato paralelo incompatible.
- La selección de participantes para alta procede del catálogo específico de
  bitácora; la validación server-side de ticket y participantes sigue siendo
  definitiva. `/support-members` no se consume para este flujo.

## Rutas Next

Rutas reales revisadas (grupos entre paréntesis no forman segmento público):

`/`, `/login`, `/auth/success`, `/auth/complete-profile`, `/dashboard`,
`/tickets`, `/tickets/new`, `/tickets/[id]`, `/activity-log`,
`/activity-log/new`, `/activity-log/[id]`, `/inventory`, `/inventory/new`,
`/inventory/[id]`, `/inventory/[id]/edit`, `/admin/categories`,
`/admin/support-members`, `/admin/support-members/new`,
`/admin/support-members/[id]`, `/admin/support-members/[id]/edit`, `/reports`,
`/profile`, `/forbidden`, y las convenciones `/not-found`, `/error` y
`/global-error`. `/design-system` se eliminó porque era un showcase temporal.

La tabla central `src/components/layout/navigation.ts` incluye rutas de negocio
y segmentos heredados. Se corrigió `RoleGuard` para denegar rutas autenticadas
que no tengan una política declarada; antes la ausencia de regla dejaba pasar
el contenido protegido. Añadí una prueba de regresión. Los 401 globales de
sesión llevan a login excepto `/auth/complete-profile`, donde el 401 de la
cookie temporal permite completar el formulario. Los 403 no se convierten en
404; los 404 de recursos conservan mensajes de no encontrado donde aplica.

## Auth, cookies y RBAC

- Express es autoridad de OAuth, sesión, onboarding y autorización. Frontend
  usa solo `credentials: "include"`; JavaScript no lee cookies.
- No se usa NextAuth/Auth.js, JWT en frontend, `Authorization: Bearer`,
  `document.cookie`, `localStorage` ni `sessionStorage` para sesión.
- OAuth inicia con navegación completa al backend; el callback es backend.
  Logout hace POST al backend, elimina cachés privadas en memoria y vuelve a
  `/login`. Onboarding POST no se reintenta automáticamente y se confirma con
  una lectura fresca de `/auth/me` en `/auth/success`.
- `role` controla presentación/permisos de UX; `supportAreas` y `skills` ayudan a filtrar o
  contextualizar, nunca sustituyen autorización backend.
- Matriz: USER: dashboard/tickets propios/nuevo ticket/perfil; SUPPORT:
  dashboard/cola/bitácora lectura/perfil; SUB_MANAGER: funciones SUPPORT,
  bitácora lectura-edición-historial e inventario; ADMIN: dashboard/tickets
  globales/bitácora según contrato/inventario/reportes/categorías/personal de
  soporte/perfil. El catálogo de personal ADMIN-only no se usa para resolver
  participantes SUB_MANAGER.
- La prueba estática no acredita membresía FCQI/UABC. El dominio de correo por
  sí solo no demuestra pertenencia a FCQI; resolverlo es institucional/backend.

## API, caché y errores

- Las claves de listas/detalles están agrupadas por entidad. Dashboard mantiene
  prefijo común para invalidación, con claves distintas
  `dashboard/user`, `dashboard/support` y `dashboard/admin`: evita compartir
  formas de respuesta entre roles al cambiar sesión.
- Crear ticket invalida listado y dashboard; cambios de asignación/estado/
  prioridad invalidan lista, detalle, eventos y dashboard. Categoría invalida
  categorías y catálogo de alta. Inventario invalida listado/detalle y
  dashboard. Personal de soporte invalida listas/detalle y dashboard (métrica
  de técnicos activos). Bitácora invalida lista/detalle/historial afectados;
  perfil invalida `/auth/me`. No se ejecuta `queryClient.clear()` en mutaciones
  normales; limpieza global de cachés privadas está limitada a logout.
- Query functions propagan `AbortSignal`; queries usan retry limitado
  condicionado a red/5xx, sin retry de 4xx. Mutaciones establecen `retry:false`.
- `ApiError` conserva `status`, `code`, `message`, `fields`, `requestId` y
  `cause`. Formularios mapean campos backend sin perder valores. Request ID es
  secundario. Los conflictos 409 refrescan contexto donde procede; 422 conserva
  errores localizados. No hay interceptor que convierta todos los errores a
  login o forbidden.
- Se agregaron boundary global/segment y página 404 en español; no muestran
  stack traces. Para recursos, la vista distingue 403/404 donde aplica.

## UX, accesibilidad y responsive

La inspección de componentes confirma HTML semántico, labels en formularios,
estados inválidos y mensajes asociados, foco visible global, `aria-current` en
navegación, nombres accesibles en botones de icono principales y dialogs con
confirmación para acciones sensibles. Los estados de negocio incluyen texto y
no dependen solo del color. Avatares externos usan alt y fallback cuando falla
la imagen; no se usan para autorización. Enlaces de descarga aceptan solo HTTP/
HTTPS y abren con `rel="noopener noreferrer"`.

Listas con tabla/tarjeta responden a anchos; tablas mantienen overflow
horizontal controlado. Las formas y botones usan la escala compartida. Esto es
una revisión estática y de pruebas, no una certificación WCAG ni comprobación
manual de todos los viewports. Ver 390×844, 768×1024 y 1440×900 en el plan
manual antes de aceptación.

La interfaz de producto está en español. El showcase/datos de ejemplo fueron
retirados y no se encontraron mocks runtime. `AppLogo` reutiliza
`public/Logo-uabc.png` como escudo UABC institucional; no es un asset específico
de FCQI. CSS usa Inter/system fallback; no se incluyen fuentes propietarias de
Proxima Nova.

## Seguridad estática y calidad

La búsqueda en `src/` no encontró secretos, almacenamiento de auth en browser,
JWT/Bearer, `document.cookie`, `dangerouslySetInnerHTML`, `console.log` ni
`console.debug`. `.env.local` está cubierto por `.gitignore`; `.env.example` es
el único archivo env trackeado y solo contiene dos URLs públicas de ejemplo.
No imprimir ni versionar valores locales. No se encontró `any`, `@ts-ignore`,
`@ts-expect-error` o `as unknown as` en el código fuente revisado.

`/design-system`, el showcase con datos de muestra y el componente
`ModulePlaceholder` ya no existen. Se corrigieron referencias obsoletas en
README y módulos. El stub no funcional de creación de bitácora y su helper POST
sin consumidores se retiraron; el mensaje blocker y la ruta explicativa
permanecen. No se hizo refactor general de duplicaciones de componentes.

Dependencias declaradas corresponden al stack en uso: Next/React, TanStack
Query, openapi-fetch/openapi-typescript, RHF/Zod, Tailwind/PostCSS, ESLint,
Vitest/Testing Library y utilidades de clases/iconos. No se identificó un
paquete temporal obvio para eliminar. `pnpm audit` encontró tres advisories en
dependencias de desarrollo: `braces@3.0.3` (HIGH, transitiva bajo
`eslint-config-next`/`fast-glob`, agotamiento de stack ante patrones anidados;
parche `>=3.0.4`, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm));
`vitest@3.2.7` y `@vitest/mocker` (MODERATE, path traversal/lectura arbitraria
con redirect mock; parche Vitest `>=4.1.11`,
[GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)).
La exposición es de herramientas de desarrollo/pruebas, no de dependencias
runtime de producción; el caso de Vitest requiere emplear la función de mock
afectada. No se aplicó actualización mayor ni override sin verificar
compatibilidad: actualizar Vitest 3→4 requiere una tarea focalizada con
revisión de compatibilidad; el parche de `braces` puede tratarse como override
transitivo acotado. Ambos quedan registrados para remediación.

## Limitaciones conocidas y blockers

1. OAuth real y aceptación rol por rol pendientes de credenciales/cuentas de
   prueba autorizadas; no se incluyen credenciales en el plan.
2. Backend real/CORS/cookies de producción, HTTPS, dominios y variables de
   producción no se validaron desde este workspace.
3. UABC/FCQI debe definir verificación de membresía; dominio UABC por sí solo
   no garantiza adscripción FCQI.
4. Existe escudo UABC en uso; si la institución entrega una marca específica
   FCQI, sustituirlo por el asset autorizado.
5. `--webpack` en `dev`/`build` y `experimental.useTypeScriptCli: false` se
   mantienen por el problema ambiental documentado. TypeScript se valida
   explícitamente con `pnpm exec tsc --noEmit`; no se deshabilitó.
6. Sin sesión provisionada no se pudo comprobar visualmente cada rol con datos
   reales; ejecución descrita en `MANUAL_ACCEPTANCE_TEST_PLAN.md`.

## Documentación

La documentación requerida existe: `FRONTEND_ARCHITECTURE.md`,
`DESIGN_SYSTEM.md`, `API_INTEGRATION.md`, `AUTH_AND_RBAC.md`,
`USER_MODULE.md`, `SUPPORT_MODULE.md`, `ACTIVITY_LOG_MODULE.md`,
`INVENTORY_MODULE.md`, `CATEGORIES_ADMIN_MODULE.md`,
`SUPPORT_MEMBERS_ADMIN_MODULE.md`, `ADMIN_TICKETS_MODULE.md`,
`ADMIN_DASHBOARD_MODULE.md` y `REPORTS_MODULE.md`. README se actualizó para el
estado final. El plan manual está en `MANUAL_ACCEPTANCE_TEST_PLAN.md`.

## Deuda técnica priorizada

1. Alta — completar aceptación OAuth, cookies/CORS/HTTPS y permisos con cuentas
   reales autorizadas; completar aceptación manual por cada rol, incluido el
   flujo actualizado de creación de bitácora.
2. Media — sustituir el escudo UABC por marca FCQI solo si se entrega asset
   oficial; verificar la alternativa accesible.
3. Media — cuando exista staging, revisar contraste y navegación teclado/
   lector de pantalla con pruebas manuales/WCAG; el análisis actual es estático.
4. Baja — reevaluar workaround Webpack/Next al actualizar la plataforma; no
   retirarlo hasta reproducir que Turbopack y el typecheck configurado operan.

## Verificaciones

Resultados finales (registrar aquí al completar comandos):

| Comando | Resultado |
| --- | --- |
| `pnpm generate:api` | PASS — openapi-typescript 7.13.0; generó el endpoint autorizado `GET /catalog/activity-log-participants` y su esquema candidato |
| `pnpm lint` | PASS |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm test` | PASS — 18 archivos, 130 pruebas |
| `pnpm build` | PASS — Next.js 16.3.8/Webpack, 19 rutas generadas; `/design-system` no aparece. `useTypeScriptCli` sigue desactivado según workaround documentado. |
| `pnpm audit` | 1 HIGH (`braces@3.0.3`), 2 MODERATE (`vitest@3.2.7`, `@vitest/mocker`); exit 1 por advisories |
| `git diff --check` | PASS |

`pnpm generate:api` completó con openapi-typescript 7.13.0 y añadió el contrato
de candidatos a `src/types/api.generated.ts`. No quedan `.only`, `.skip` ni `.todo`. Se
verifican por conducta auth/RBAC, USER, SUPPORT, bitácora, categorías, soporte,
tickets ADMIN, dashboard ADMIN, reportes y schemas/formas de inventario; no se
persigue un porcentaje artificial.

El smoke test de `pnpm dev` en 3001 no pudo ejecutarse: Next recibió
`EADDRINUSE` al enlazar el puerto, aunque las consultas HTTP no respondieron.
No se identificó ni detuvo el proceso que ocupa el puerto. Repetir el smoke
test cuando 3001 esté disponible.

No se ejecutó pentesting ni se modificó backend. La inspección de origen no
valida el despliegue final; usar el plan manual antes de liberación.
