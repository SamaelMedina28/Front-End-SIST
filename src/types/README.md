# Tipos de API

`api.generated.ts` se genera desde el contrato OpenAPI del backend mediante
`pnpm generate:api` cuando Express está disponible.

No declarar aquí manualmente endpoints, propiedades ni enums que sustituyan el
contrato. Si Express está apagado, dejar el archivo pendiente y levantar el
backend antes de generarlo.
