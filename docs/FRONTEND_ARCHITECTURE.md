# Arquitectura del frontend

Next App Router separa las entradas públicas (`/login`, `/auth/success`,
`/auth/complete-profile`, `/forbidden`) del grupo `(authenticated)`. Su layout
monta RoleGuard, compuesto con SessionGate: consulta Express desde el navegador,
resuelve la política de ruta centralizada y presenta AppShell e hijos solo
después de confirmar sesión y rol. Los módulos del Paso 4 son placeholders.

`src/features/auth/api.ts` agrupa las operaciones tipadas de autenticación sobre
el cliente compartido. `queries/current-user.ts` define la clave y el hook de
sesión; `mutations/session.ts` coordina onboarding, logout y caché. Los componentes
de la feature implementan las entradas y estados, y `schemas/complete-profile.ts`
contiene exclusivamente validación de experiencia de usuario y etiquetas.

TanStack Query es la única fuente del estado remoto. QueryProvider sigue en el
layout raíz; no existe un segundo contexto de usuario. El contrato generado
define los tipos y Express valida permisos, estado activo y sesión. Las páginas
server solo componen vistas; no implementan un BFF ni leen credenciales.

El Design System permanece compartido. AppShell recibe datos de sesión mediante
props; su showcase puede renderizarlo sin usuario. El logo continúa siendo el
placeholder textual documentado. Las variables públicas viven en `.env.local`
(ignorado); se documentan en `.env.example`.

Ver `AUTH_AND_RBAC.md` para rutas, matriz de roles, transiciones, errores y
limpieza de caché. La navegación de escritorio y móvil comparte la misma
configuración de UX-RBAC; Express conserva toda autorización real. Los módulos
de negocio no forman parte de la implementación actual.
