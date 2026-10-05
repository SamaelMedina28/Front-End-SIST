# Integración con la API Express

## Direcciones

| Servicio | URL |
| --- | --- |
| Frontend | `http://localhost:3001` |
| Backend | `http://localhost:3000` |
| API REST | `http://localhost:3000/api/v1` |
| OpenAPI | `http://localhost:3000/api/openapi.json` |
| Swagger | `http://localhost:3000/api/docs` |

Configurar en `.env.local` (sin secretos):

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

`NEXT_PUBLIC_API_URL` es el prefijo REST validado; `NEXT_PUBLIC_BACKEND_URL`
queda disponible para futuros flujos que empiecen fuera de `/api/v1`. No
colocar secretos en variables `NEXT_PUBLIC_*`.

## Contrato generado

`pnpm generate:api` ejecuta `openapi-typescript` contra
`http://localhost:3000/api/openapi.json` y genera
`src/types/api.generated.ts`. Ese archivo se versiona como salida generada; no
se edita ni formatea manualmente. Después de cambios en rutas, schemas o enums
del backend, arrancar Express y volver a ejecutar el generador antes de consumir
el contrato en el frontend.

En el backend actual, OpenAPI incluye el prefijo `/api/v1` en cada path. Por
eso, openapi-fetch usa el origen del `NEXT_PUBLIC_API_URL` como `baseUrl` y
conserva el path completo de OpenAPI; concatenar el prefijo dos veces enviaría
las solicitudes a `/api/v1/api/v1/...`.

## Cliente de navegador y cookies

`src/lib/api/browser-client.ts` centraliza la configuración de openapi-fetch. El
acceso diferido a la instancia compartida utiliza los `paths` generados y
configura `credentials: "include"`. La sesión pertenece a Express
y llega mediante una cookie `HTTP-only`; la aplicación no necesita leer ni
decodificar su contenido.

Frontend y backend usan orígenes distintos (puertos 3001 y 3000), así que el
navegador adjunta la cookie a las solicitudes cross-origin compatibles cuando
se usa `credentials: "include"` y el backend responde con CORS y credenciales
correctos. No usar `mode: "no-cors"`.

Las solicitudes autenticadas se originan en el navegador para que el navegador
y Express gestionen esa cookie. No se añade un proxy `/api/*`, Route Handler ni
Server Action como BFF. Una petición server-side de Next no reenvía
automáticamente la cookie del navegador a Express; un futuro caso server-side
requiere una decisión explícita para reenviarla.

## Respuestas y errores

El backend responde con `{ success: true, data }` y puede incluir `meta` en
listas. `unwrapResponse` extrae `data`, devuelve `undefined` para `204` y lanza
`ApiError` ante respuestas HTTP fallidas, respuestas inesperadas o errores del
contrato.

`ApiError` conserva `kind` (`http`, `network` o `unexpected`), `status`, `code`,
`message`, `fields`, `requestId` y `cause` cuando existe. Se muestra el mensaje
del backend si está disponible; las respuestas no JSON usan un texto controlado
con el status. Los fallos `TypeError` de Fetch se clasifican como red. No se
incluyen trazas ni cabeceras en mensajes de usuario o logs.

`fields` permanece como `unknown` para no imponer una forma más específica que
el OpenAPI. Formularios futuros podrán mapearlo cuando el contrato real lo
permita.

## TanStack Query

El `QueryClient` conserva caché normal y usa un `staleTime` de 30 segundos.
Queries hacen como máximo un retry ante fallo de red o status 5xx; no reintentan
errores 4xx, respuestas inesperadas ni errores desconocidos. Mutations tienen
`retry: false`, en particular para no repetir automáticamente operaciones con
efectos.

Convención de query keys para etapas posteriores:

- `['auth', 'me']`
- `['tickets', filters]`, `['tickets', id]`, `['tickets', id, 'events']`
- `['dashboard']`, `['categories']`
- `['inventory', filters]`, `['activity-log', filters]`
- `['support-members', filters]`, `['reports', filters]`

Cada mutation debe invalidar solo los recursos relacionados. Por ejemplo, crear
un ticket podría invalidar `['tickets']` y `['dashboard']`; no usar
`queryClient.clear()` como invalidación habitual.

## Idempotencia y cancelación

Una mutation que requiera `Idempotency-Key` generará la clave en ese flujo y la
conservará durante el mismo intento lógico. No se configura globalmente y no se
reutiliza con otro payload. Las funciones de query pasarán el `AbortSignal` de
TanStack Query a openapi-fetch para permitir cancelación. No existe timeout
global en esta etapa.

## Tipos

Los paths, parámetros, cuerpos, respuestas y enums deben proceder de
`api.generated.ts`. `src/lib/api/browser-client.ts` expone una única instancia
compartida y tipada con `paths`; se inicializa al primer uso para que importar
el módulo no requiera variables de entorno. `src/types/api.ts` deriva los enums
de roles, estados y prioridades desde los schemas. Los labels/tonos visuales
siguen en frontend y TypeScript comprueba sus claves contra esos enums.

El script `pnpm dev` selecciona Webpack explícitamente, igual que `pnpm build`.
En este entorno Turbopack no resuelve correctamente el `@import "tailwindcss"`
de `globals.css` aunque el paquete esté instalado; Webpack evita ese error al
acceder al frontend.

## Seguridad

No se almacenan tokens, no se leen cookies desde JavaScript y no se registran
cookies, tokens ni cabeceras completas. El frontend solo contiene las dos URLs
públicas. No se usa Axios ni una segunda capa HTTP.

## Estado de generación

El endpoint local OpenAPI debe estar activo al ejecutar `pnpm generate:api`.
Si el servicio está apagado, el generador falla y no se crea un contrato de
sustitución. No iniciar el servidor del backend desde este frontend: su proceso
principal también arranca el worker de notificaciones y conecta Prisma.
