# Sistema Integral de Soporte Técnico FCQI — UABC

Frontend Next.js independiente para el backend REST de Express.

## Requisitos y desarrollo local

- Node.js compatible con Next.js 16 y pnpm 11.
- Backend disponible en `http://localhost:3000`.
- El backend debe configurar `FRONTEND_URL=http://localhost:3001` y permitir
  credenciales CORS para ese origen.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Abre `http://localhost:3001`. Ajusta en `.env.local` únicamente las variables
públicas `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_BACKEND_URL` al entorno local.
Nunca coloques secretos del backend en este frontend.

## OpenAPI y verificaciones

Con el backend ejecutándose, sincroniza los tipos generados:

```bash
pnpm generate:api
```

No edites manualmente `src/types/api.generated.ts`. Verifica cambios con:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
pnpm audit
```

Los comandos `dev` y `build` usan Webpack por el problema ambiental de
Turbopack documentado en [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

## Alcance y límites conocidos

El frontend cubre autenticación y onboarding, tickets, bitácora, inventario,
administración, dashboard y reportes. La creación de bitácora para
SUB_MANAGER permanece bloqueada: el backend requiere `participantIds`, pero no
expone un catálogo autorizado para ese rol. OAuth real y aceptación por rol
requieren validación manual con el backend y cuentas institucionales.

Consulta [la auditoría final](docs/FINAL_FRONTEND_AUDIT.md) y el
[plan manual de aceptación](docs/MANUAL_ACCEPTANCE_TEST_PLAN.md) antes de
desplegar.
