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
