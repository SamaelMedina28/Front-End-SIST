# Arquitectura del frontend

Next App Router separa las entradas públicas (`/login`, `/auth/success`,
`/auth/complete-profile`, `/forbidden`) del grupo `(authenticated)`. Su layout
monta RoleGuard, compuesto con SessionGate: consulta Express desde el navegador,
resuelve la política de ruta centralizada y presenta AppShell e hijos solo
después de confirmar sesión y rol. La política de roles permanece centralizada
en la navegación.

`src/features/auth/api.ts` agrupa las operaciones tipadas de autenticación sobre
el cliente compartido. `queries/current-user.ts` define la clave y el hook de
sesión; `mutations/session.ts` coordina onboarding, logout y caché. Los componentes
de la feature implementan las entradas y estados, y `schemas/complete-profile.ts`
contiene exclusivamente validación de experiencia de usuario y etiquetas.

El Paso 5 añade `features/tickets` (dashboard, listado, formulario, detalle,
eventos y caché) y `features/profile` (edición de perfil). Sus APIs derivan tipos
del OpenAPI generado; las páginas App Router se limitan a componer vistas. La
lectura de tickets conserva `meta` de paginación con `requestApiEnvelope`, mientras
`requestApi` sigue siendo la interfaz sencilla para respuestas que solo necesitan
`data`. Los módulos invalidan únicamente las queries afectadas y reutilizan
`auth/me` como fuente de la sesión actual.

El Paso 6 extiende `features/tickets` para SUPPORT: conserva las vistas USER,
incorpora el dashboard de soporte, filtros de cola derivados del OpenAPI y
controles asignados al detalle común. Las mutaciones viven en
`mutations/support-actions.ts`, reutilizan el cliente compartido, desactivan
retry y refrescan ticket, eventos, lista y dashboard. Solo PATCH de estado
envía `Idempotency-Key`.

El Paso 7 reutiliza las mismas vistas y acciones técnicas para SUPPORT y
SUB_MANAGER. `features/activity-log` integra listado paginado, filtros reales,
detalle, edición parcial e historial mediante el cliente OpenAPI/TanStack
Query. La creación se presenta desde el ticket, pero queda bloqueada por la
ausencia de un catálogo de participantes autorizado para SUB_MANAGER; no se
usa el endpoint ADMIN-only `/support-members`.

El Paso 8 añade `features/inventory`: listado paginado con filtros URL,
formularios discriminados por tipo, detalle incluso para artículos inactivos,
PATCH parcial y desactivación soft-delete. El historial usa exclusivamente el
endpoint por artículo y su propia paginación. SUB_MANAGER y ADMIN comparten las
mismas vistas; el contrato OpenAPI generado define los payloads. Ver
`INVENTORY_MODULE.md` para reglas, límites y verificación manual.

El Paso 9 implementa `features/categories` y `features/support-members` bajo
rutas ADMIN-only ya declaradas en la tabla de navegación. Las categorías se
administran con baja lógica y subcategorías anidadas; sus mutations invalidan
`['categories']` y `['catalog', 'ticket-form']`. El personal técnico usa filtros
y paginación server-side, detalle y preprovisionamiento OAuth sin credenciales;
`isActive` se puede modificar por PATCH. Cada feature mantiene API, query keys,
schemas y mutations propios. Los contratos y restricciones se documentan en
`CATEGORIES_ADMIN_MODULE.md` y `SUPPORT_MEMBERS_ADMIN_MODULE.md`.

TanStack Query es la única fuente del estado remoto. QueryProvider sigue en el
layout raíz; no existe un segundo contexto de usuario. El contrato generado
define los tipos y Express valida permisos, estado activo y sesión. Las páginas
server solo componen vistas; no implementan un BFF ni leen credenciales.

Los tokens y primitives del Design System permanecen compartidos, pero su ruta
de showcase temporal ya se retiró y no forma parte del producto. AppShell
recibe datos de sesión mediante props. `AppLogo` reutiliza el escudo UABC local;
no existe un asset específico de FCQI. Las variables públicas viven en
`.env.local` (ignorado) y se documentan en `.env.example`.

Ver `AUTH_AND_RBAC.md` para rutas, matriz de roles, transiciones, errores y
limpieza de caché. La navegación de escritorio y móvil comparte la misma
configuración de UX-RBAC; Express conserva toda autorización real. Los alcances
de negocio y límites actuales están en `USER_MODULE.md`, `SUPPORT_MODULE.md`,
`INVENTORY_MODULE.md`, `CATEGORIES_ADMIN_MODULE.md` y
`SUPPORT_MEMBERS_ADMIN_MODULE.md`.
