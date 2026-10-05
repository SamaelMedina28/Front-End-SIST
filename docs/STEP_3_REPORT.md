# Entrega del Paso 3

Autenticación y onboarding implementados con Express como autoridad y TanStack
Query como única caché de sesión. El trabajo termina en el Paso 3. La prueba
OAuth completa con una cuenta UABC queda pendiente de ejecución manual.

## Archivos creados

- `src/app/login/page.tsx`
- `src/app/auth/success/page.tsx`
- `src/app/auth/complete-profile/page.tsx`
- `src/app/(authenticated)/layout.tsx`
- `src/app/(authenticated)/dashboard/page.tsx`
- `src/app/forbidden/page.tsx`
- Todos los archivos de `src/features/auth/` listados abajo.
- `tests/auth-api.test.ts`, `tests/auth-ui.test.tsx`, `tests/auth-fixture.ts`.
- `vitest.config.ts`.
- `docs/AUTH_AND_RBAC.md`, `docs/FRONTEND_ARCHITECTURE.md` y este reporte.
- `.env.local` local e ignorado por Git: únicamente las dos URLs públicas.
- `AGENTS.md` y `CLAUDE.md`: generados automáticamente por `next dev`, no son
  parte de la lógica de autenticación.

## Archivos modificados

- `src/app/page.tsx`: entrada al login.
- `src/components/layout/app-shell.tsx`: recibe el usuario remoto.
- `src/components/layout/topbar.tsx`: identidad real, avatar y logout.
- `src/components/layout/sidebar.tsx`: elimina usuario ficticio y detecta ruta activa.
- `src/components/layout/mobile-navigation.tsx`: ruta activa real en el drawer.
- `src/components/layout/navigation.ts`: Inicio apunta a `/dashboard`.
- `src/components/shared/loading-state.tsx`: esqueletos sin overflow móvil.
- `src/components/ui/input.tsx` y `select.tsx`: admiten refs de React 19 para
  registro y enfoque de errores desde React Hook Form.
- `package.json` y `pnpm-lock.yaml`: dependencias de pruebas.
- `README.md`: instrucciones de autenticación y verificación manual.

Next y TypeScript también regeneraron sus metadatos durante las comprobaciones.
`api.generated.ts` no fue editado manualmente y el backend no fue modificado.

## Dependencias

Agregadas solo en desarrollo: `@testing-library/react` 16.3.3,
`@testing-library/user-event` 14.6.7 y `jsdom` 30.1.1. No se eliminó ninguna
dependencia directa ni se añadió una biblioteca de autenticación.

## Estructura de auth

```text
src/features/auth/
  api.ts
  components/
    auth-error.tsx
    auth-frame.tsx
    complete-profile-form.tsx
    google-login-button.tsx
    session-gate.tsx
    user-avatar.tsx
  mutations/
    session.ts
  queries/
    current-user.ts
  schemas/
    complete-profile.ts
```

## Comportamiento entregado

`useCurrentUser()` consulta `/api/v1/auth/me` con AbortSignal y la clave
`['auth', 'me']`; staleTime 15 segundos, revalidación al montar/recuperar foco,
un retry de red/5xx y ninguno de 4xx. No hay polling ni un segundo estado de usuario.

AuthGuard espera una respuesta de la visita actual antes de presentar AppShell.
Muestra PageSkeleton al cargar, contenido con sesión válida, login ante 401 y
ErrorState con reintento ante otros errores. Oculta datos antiguos si falla la
revalidación de sesión.

`/login` ofrece navegación completa al OAuth de Express y omite el formulario
si ya hay sesión. `/auth/success` comprueba `/me` y reemplaza la ruta por
dashboard o login. `/auth/complete-profile` permite el formulario tras un 401
de `/me`, pero redirige al dashboard cuando ya hay sesión normal.

El formulario usa el schema generado `CompleteProfileInput`: `institutionalId`
string, `communityType` con STUDENT/TEACHER/ADMINISTRATIVE y `phone` opcional
string/null. Las etiquetas se traducen; los valores enviados no. El teléfono
vacío se envía como null. Hay RHF/Zod, errores inline, foco en el primer error,
valores preservados, feedback accesible y bloqueo contra POSTs concurrentes.

El 201 invalida la query y navega a `/auth/success` para comprobar la sesión
antes de dashboard. El reintento de esa comprobación no repite el registro.
ApiError mantiene requestId y el mensaje del backend. `fields` se asigna a los
controles solo si coincide con las claves conocidas y arrays de strings.
ONBOARDING_REQUIRED/EXPIRED muestran un mensaje comprensible y enlace a login.

Logout utiliza POST/204; un 401 por sesión vencida también completa la salida.
Cancela queries pendientes, elimina las queries privadas, establece auth en
null, limpia la caché de mutations y reemplaza por login. Un fallo de servidor
o red conserva el estado y ofrece reintento. La cookie la elimina Express.

No existe redirección global de 401. Los 5xx/network nunca se interpretan como
sesión ausente. `/forbidden` contiene el mensaje solicitado, sin RBAC todavía.

## Resultados exactos de verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | Exit 0; sin errores ni warnings |
| `pnpm exec tsc --noEmit` | Exit 0; sin diagnósticos |
| `pnpm test` | Exit 0; 4 archivos, 42 tests correctos (26 nuevos y 16 existentes) |
| `pnpm build` | Exit 0; Next 16.3.8 Webpack, compilación en 8.1 s, TypeScript en 4.5 s, 9/9 páginas estáticas generadas |
| `pnpm dev` | `next dev --webpack --port 3001`; Next 16.3.8 Webpack; `Ready in 325ms` |

El servidor anterior se identificó como `next dev --webpack --port 3001`
(proceso padre 141836, servidor 141853) y se confirmó su directorio FRONT-SIST.
Se detuvo ordenadamente ese proceso y se inició el script del proyecto de nuevo.
El servidor reiniciado respondió `GET /login 200` y se comprobó el botón Google
después de consultar la sesión. El servidor de desarrollo quedó en ejecución.

En navegador se verificaron login y onboarding a 390×844, sin overflow
horizontal, con validación de campos/foco y navegación móvil operativa. Se
verificaron `/auth/success` → `/login` y `/dashboard` → `/login` sin sesión.
La Topbar con nombre largo se midió a 390×844 con HTML temporal generado desde
los componentes reales y una fixture sintética; ancho total y header: 390 px.
Los archivos temporales fueron retirados.

No se automatizó Google ni se usaron credenciales. Los recorridos completos de
usuario existente/nuevo, cookie temporal real y logout de una cuenta UABC deben
comprobarse manualmente siguiendo `AUTH_AND_RBAC.md`. Los tests de esos estados
usan respuestas aisladas y no crean usuarios en el backend.

## Decisiones, discrepancias, riesgos y deuda

- No se añadió AuthProvider: la caché de Query ya representa la sesión.
- El contrato no expone `isActive`; Express lo valida antes de devolver `/me`.
- OpenAPI documenta 200/401 en `/me`, pero el middleware real también devuelve
  403 USER_DISABLED. La UI conserva ese error y su mensaje sin inventar permisos.
- El tipo generado de respuesta permite data undefined; se comprueba el usuario
  antes de considerarlo una sesión. No se modificó el contrato.
- Los códigos ONBOARDING_REQUIRED/EXPIRED se verificaron en código de backend
  de solo lectura; OpenAPI declara el campo code como string.
- Se usa botón de logout porque no había DropdownMenu. El avatar HTTPS usa
  img sin referrer, con fallback de iniciales y excepción de lint documentada.
- La validación OAuth real sigue pendiente; también depende de CORS, cookies,
  Google y FRONTEND_URL del backend. Ninguna de esas configuraciones se alteró.
- En el Paso 3, `/design-system` y los enlaces de módulos eran temporales; el
  showcase `/design-system` se retiró en la auditoría final. No contienen datos
  privados. En esa etapa no había navegación por rol ni dashboard de negocio.
- El próximo paso recomendado es ejecutar la prueba manual institucional y,
  después, implementar únicamente el RBAC visual del Paso 4.
