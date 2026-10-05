# Frontend — Sistema Integral de Soporte Técnico FCQI

Frontend independiente para el backend Express REST del Sistema Integral de
Soporte Técnico FCQI — UABC.

## Estado

El proyecto se encuentra en el paso 0: base técnica y tokens de diseño. No se
han implementado pantallas de negocio ni llamadas a la API.

## Desarrollo

```bash
pnpm install
pnpm dev
```

La aplicación se sirve en `http://localhost:3001`.

## Tipos OpenAPI

Con el backend local ejecutándose, genera el contrato tipado con:

```bash
pnpm generate:api
```

El archivo `src/types/api.generated.ts` es generado automáticamente y no debe
editarse manualmente.
