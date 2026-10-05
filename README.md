# Frontend — Sistema Integral de Soporte Técnico FCQI

Frontend independiente para el backend Express REST del Sistema Integral de
Soporte Técnico FCQI — UABC.

## Desarrollo

En una terminal, inicia el backend Express en `http://localhost:3000`. En otra:

```bash
pnpm install
pnpm dev
```

El frontend se sirve en `http://localhost:3001`. Copia las variables de
`.env.example` a `.env.local` si el entorno no las tiene definidas.
Los scripts de desarrollo y build usan Webpack para mantener consistente el
procesamiento de Tailwind en este entorno.

## Tipos OpenAPI

Con el backend local ejecutándose, genera el contrato tipado con:

```bash
pnpm generate:api
```

El archivo `src/types/api.generated.ts` es generado automáticamente y no debe
editarse manualmente.

## Autenticación (Paso 3)

Define las dos URLs públicas de `.env.example` en `.env.local` antes de iniciar
Next. Con Express activo en 3000 y su `FRONTEND_URL` apuntando a 3001, abre
`http://localhost:3001/login` y pulsa «Continuar con Google».

El acceso con cuenta UABC se realiza manualmente. Los usuarios existentes pasan
por `/auth/success`; los nuevos completan `/auth/complete-profile`. Ambos llegan
a `/dashboard`, una confirmación temporal de sesión. «Cerrar sesión» se
encuentra en la Topbar. No hay métricas ni módulos de negocio en este paso.

`pnpm test` ejecuta pruebas aisladas sin acceder a Google ni a Express.
Consulta `docs/AUTH_AND_RBAC.md` para el flujo, los contratos y la guía manual.
El RBAC visual corresponde al Paso 4.
