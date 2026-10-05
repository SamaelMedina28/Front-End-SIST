# Autenticación y RBAC visual — Pasos 3 y 4

Este documento cubre sesión, onboarding, logout y protección UX por rol.
`/dashboard` reutiliza dashboard USER o técnico según el rol. Inventario y
administración permanecen placeholders fuera del alcance actual.

## Autoridad y cookies

Express implementa Google OAuth, el callback, la firma/verificación de sesión y
la consulta del usuario en base de datos. Next navega completamente a
`${NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/google`; no usa fetch para comenzar
OAuth, ni popups. Google vuelve al callback de Express en el puerto 3000.

La cookie normal y la cookie temporal de onboarding son HTTP-only. Todas las
peticiones de la feature usan el cliente openapi-fetch existente con
`credentials: "include"`. El navegador gestiona las cookies; JavaScript no las
lee ni decodifica. No hay tokens en almacenamiento del frontend.

No se utiliza NextAuth/Auth.js porque duplicaría la autoridad de Express. No
hay middleware, Route Handlers, Server Actions ni proxy de autenticación. Los
Server Components no intentan reenviar cookies a otro origen. El guard del
navegador controla la presentación; Express mantiene la seguridad de sus APIs.

## Rutas y estados

| Ruta | Mientras valida | Sesión válida | 401 | Otros errores |
| --- | --- | --- | --- | --- |
| `/login` | LoadingState | Reemplaza por `/dashboard` | Botón Google | ErrorState y reintento |
| `/auth/success` | LoadingState | Reemplaza por `/dashboard` | Reemplaza por `/login` | ErrorState y reintento |
| `/auth/complete-profile` | LoadingState | Reemplaza por `/dashboard` | Formulario | ErrorState y reintento |
| Grupo `(authenticated)` | PageSkeleton | AppShell y contenido | Reemplaza por `/login` | ErrorState y reintento |

`/` redirige a `/login`. `/forbidden` presenta el mensaje de acceso restringido.
`/design-system` sigue siendo un catálogo público de
desarrollo y no contiene datos de sesión.

## Roles y permisos de interfaz

La configuración única de navegación y rutas está en
`src/components/layout/navigation.ts`. El tipo `Role` se deriva del schema
OpenAPI generado `User['role']`; no se duplica el enum. La interfaz consulta
exclusivamente ese campo, no `communityType`, `supportAreas` ni claims del
navegador.

| Rol | Tickets | Nuevo ticket | Bitácora | Inventario | Reportes | Administración | Perfil |
| --- | --- | --- | --- | --- | --- | --- | --- |
| USER | Sí (Mis tickets) | Sí | No | No | No | No | Sí |
| SUPPORT | Sí (técnico) | No | Sí (lectura) | No | No | No | Sí |
| SUB_MANAGER | Sí (técnico) | No | Sí (lectura, editar e historial; POST bloqueado por catálogo de participantes) | Sí (placeholder) | No | No | Sí |
| ADMIN | Sí (sin dashboard implementado) | No | Sí (lectura e historial) | Sí (placeholder) | No (placeholder) | No (fuera de alcance) | Sí |

Todos los roles autenticados conservan Inicio. La protección de URL usa
coincidencia por segmento y la regla más específica prevalece; por ejemplo,
`/tickets/new` es USER y `/tickets/{id}` usa la política de Tickets. Los
accesos directos no autorizados se redirigen a `/forbidden` sin renderizar el
contenido protegido. Las rutas no declaradas no se autorizan por esta tabla.
Desktop y móvil consumen la misma lista filtrada. El elemento activo considera
rutas anidadas sin confundir prefijos parciales.

La ruta `/activity-log/new` tiene regla más específica: solo SUB_MANAGER puede
acceder. El detalle `/activity-log/{id}` permanece en el grupo de roles de
staff. USER continúa redirigido a `/forbidden`.

El `RoleGuard` resuelve la política de la ruta y se compone con `SessionGate`:
la sesión y el rol provienen de una única query `/auth/me`; no existe selector
de rol ni estado local alternativo. Un cambio de rol se aplica cuando `/me` se
revalida al montar o recuperar foco.

Esto es protección de experiencia de usuario, no una frontera de seguridad.
Express debe autenticar y autorizar cada endpoint. Ocultar un enlace o
redirigir una URL nunca concede ni sustituye permisos del backend; los 401,
403 y errores del API deben seguir manejándose por cada feature.

Un 401 de `/me` en onboarding es normal: todavía puede existir únicamente la
cookie temporal. El POST de onboarding es quien valida esa cookie. No existe
un interceptor global que convierta cualquier 401 en una redirección.

## Fuente única de sesión

`useCurrentUser()` consume `currentUserOptions()` y `['auth', 'me']`. El usuario
es el schema generado `User`. No existe un AuthProvider ni otro `useState<User>`.

La query pasa el AbortSignal, usa staleTime de 15 segundos, vuelve a consultar
al montar y al recuperar foco, y no hace polling. Conserva la política del
Paso 2: un reintento para red/5xx, ninguno para 4xx. Cada guard espera la
consulta de esa visita, incluso si la caché contiene una sesión o un 401 previo.
Si la revalidación falla, el guard oculta el contenido aunque exista un usuario
viejo en la caché. Cambios de rol se reflejan en la siguiente consulta real.

## Contrato de onboarding

Se usa `components['schemas']['CompleteProfileInput']`, sin modificar el
archivo generado:

```ts
{
  institutionalId: string;
  communityType: 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE';
  phone?: string | null;
}
```

Las etiquetas Estudiante, Docente y Administrativo son presentación; el request
envía el enum. React Hook Form y Zod validan identificador no vacío y selección
válida. Los límites y las reglas institucionales pertenecen a Express. Se
recortan espacios y el teléfono vacío se envía como `null`; sigue siendo opcional.

Un bloqueo síncrono impide dos POST concurrentes, además del estado pending
y del botón deshabilitado. Los valores se conservan ante errores. Los errores
de campos se asocian con aria-describedby/aria-invalid y se enfoca el primero.

Después del 201 se cancela cualquier `/me` anterior, se invalida exactamente
`['auth', 'me']` sin refetch inmediato y se reemplaza la ruta por
`/auth/success`. Esta pantalla vuelve a consultar `/me` antes de `/dashboard`.
Si falla la comprobación se reintenta solamente el GET; no se repite la creación
de perfil ni se recarga toda la página.

## Errores y discrepancias del contrato

`ApiError` conserva status, code, message, fields y requestId. El formulario
solo asigna errores cuando `fields` contiene una lista de strings en una de
las tres claves reales del formulario; las demás formas usan el mensaje general.

Los códigos `ONBOARDING_REQUIRED` y `ONBOARDING_EXPIRED` se comprobaron en
`auth.controller.ts` y `session.service.ts` del backend, en modo lectura. Se
muestran como «La sesión para completar tu registro ya no es válida. Inicia
sesión nuevamente.» y ofrecen el enlace «Volver a iniciar sesión». OpenAPI
declara `code` como string; no enumera esos códigos.

El backend utiliza `USER_DISABLED`, no el ejemplo `ACCOUNT_DISABLED`. Se
conserva su mensaje real. No se inventaron códigos ni parámetros de callback.
Los fallos OAuth que Express responde directamente en su callback permanecen
en esa respuesta del backend; este frontend no inventa una ruta de error OAuth.

El schema `User` y la respuesta pública de `/me` **no incluyen `isActive`**:
Express lo valida y lo omite de la respuesta pública. No se añadió ese campo
al frontend. Aunque OpenAPI documenta 200/401 para `/me`, el middleware real
puede responder 403 `USER_DISABLED`; se muestra como error con el mensaje real.

La intersección generada para la respuesta de `/me` permite `data` undefined.
El cliente infiere ese tipo y exige un usuario con id/nombre antes de considerar
la sesión válida. No se fuerza el tipo con casts ni se edita el contrato.

## Logout y caché

`useLogout()` hace POST al backend sin reintentos. Tras 204 (o 401 por sesión
ya vencida), cancela las queries en curso para evitar repoblación tardía, elimina
todas las queries excepto la clave exacta de auth, escribe `null` en esa clave
y limpia la caché de mutations. Finalmente reemplaza la ruta por `/login`.
Esta limpieza es explícita y exclusiva de logout. Un error de red/5xx mantiene
la sesión y los datos, muestra ErrorState y permite reintentar.

No se elimina almacenamiento local ni se intenta borrar la cookie desde JS:
Express elimina las cookies. La caché nunca se persiste entre cargas del navegador.

## AppShell y avatar

RoleGuard/SessionGate proporciona el usuario de la query al AppShell. La Topbar muestra
nombre truncable, rol traducido, avatar e iniciales como fallback. El logout es
un botón accesible: el proyecto aún no tiene un patrón DropdownMenu.

El avatar usa un `img` HTTPS, sin credenciales en la URL y con
`referrerPolicy="no-referrer"`; si falla se muestran iniciales. La excepción
local de ESLint evita introducir un proxy de imágenes o dominios remotos
genéricos de Next Image. Sidebar y navegación móvil filtran enlaces con el rol
actual y consumen la misma configuración; no contienen datos ficticios.

## Prueba manual con cuenta institucional

Con Express en 3000, `FRONTEND_URL=http://localhost:3001` y Next en 3001:

1. Abrir `/login`, pulsar Google y autenticarse manualmente con una cuenta UABC.
2. Usuario existente: comprobar `/auth/success` → `/dashboard` y datos reales.
3. Usuario nuevo: completar `/auth/complete-profile` → comprobación de sesión → `/dashboard`.
4. Comprobar la Topbar y cerrar sesión; debe volver a `/login`.
5. Abrir `/dashboard` sin sesión y comprobar el retorno a login.

No automatizar credenciales, consentimiento ni Google OAuth. Las pruebas
automatizadas usan únicamente fixtures sintéticas locales. La comprobación
real de usuario existente/nuevo y cookie de onboarding requiere una sesión
institucional proporcionada manualmente; no se ha afirmado que esté verificada.

## Validación y límites

Se comprobó en navegador login/onboarding a 390×844, los errores y el foco de
validación, las redirecciones sin sesión y la navegación móvil. La Topbar con
nombre largo se verificó mediante un HTML temporal renderizado desde el
AppShell real y una fixture de test; ambos archivos temporales se retiraron.
No se creó un usuario en Express ni una sesión simulada dentro de la app.

La prueba OAuth institucional completa queda pendiente de ejecución manual.
El Paso 4 entrega rutas protegidas y placeholders para Tickets, Nuevo ticket,
Bitácora, Inventario, Reportes, Categorías, Personal de soporte y Perfil. Las
features de negocio y el dashboard funcional quedan para etapas posteriores.
