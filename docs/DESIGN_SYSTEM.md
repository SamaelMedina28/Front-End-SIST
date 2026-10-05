# Design System — FCQI / UABC

## Alcance

La interfaz inicial es light, institucional, sobria y orientada a claridad. El
showcase temporal está disponible en `/design-system` y no representa una
pantalla funcional del producto.

## Paleta y tokens

Los componentes consumen tokens semánticos definidos en
`src/app/globals.css`; no deben usar hexadecimales institucionales directamente.

| Intención | Token | Uso |
| --- | --- | --- |
| Identidad primaria | `--primary` | Acciones principales y navegación activa |
| Acento | `--accent` / `--warning` | Destacar atención o información complementaria |
| Información | `--info` | Estados informativos y roles |
| Éxito | `--success` | Estados completados |
| Advertencia | `--warning` | Seguimiento o prioridad media |
| Peligro | `--danger` | Errores y acciones destructivas |
| Superficie | `--surface` | Cards, formularios y navegación |
| Neutros | `--background`, `--muted`, `--border` | Jerarquía y separación |

El verde UABC es la identidad primaria. El ocre y el azul institucional se
reservan para acento e información. Se mantiene una base amplia de blancos y
grises para evitar saturación.

## Tipografía

La pila es `Proxima Nova`, `Inter`, `Arial`, sans-serif. No se incluyen fuentes
propietarias en el repositorio; Inter se resuelve desde el sistema cuando está
disponible.

## Espaciado, radios y layout

- Escala principal: 4, 8, 12, 16, 20, 24, 32, 40, 48 y 64px.
- Controles: 44px de alto.
- Inputs y botones: radios de 8–10px.
- Cards: 12px; dialogs: 16px.
- Sidebar desktop: 256px; topbar: 72px.
- Contenido desktop: 32px vertical / aproximadamente 40px horizontal.
- Tablet: 24px; móvil: 16px.

## Componentes

Los primitives en `src/components/ui` siguen el estilo de shadcn/ui sin
introducir dependencias Radix que todavía no son necesarias. Los componentes
compartidos están en `src/components/shared` y cubren:

- `AppLogo`, `PageHeader` y `MetricCard`.
- `StatusBadge`, `PriorityBadge` y `RoleBadge`.
- `EmptyState`, `ErrorState`, `LoadingState`, `PageSkeleton` y `ConfirmDialog`.
- `AppShell`, `Sidebar`, `Topbar` y navegación móvil basada en Sheet.

Los badges comunican estado con texto e iconografía además de color.

## Responsive y accesibilidad

La navegación es permanente desde `md` y se convierte en drawer en viewports
reducidos. Las tablas usan overflow horizontal controlado y las cards/grids
degradan progresivamente. Se mantienen labels visibles, botones y links
semánticos, focus visible, estados disabled/invalid explícitos y mensajes
textuales de error.

## Logo

No existe todavía un asset oficial en el repositorio. `public/brand/` queda
reservado para `uabc-logo.svg`; no debe redibujarse, recolorearse ni descargarse
arbitrariamente. `AppLogo` mantiene un placeholder textual temporal.

## Decisiones y límites del paso 1

- El script `build` usa `next build --webpack`: el build Webpack pasa con
  TypeScript estricto, mientras que Turbopack falla en este entorno restringido
  al intentar crear un proceso que enlace un puerto durante el procesamiento de
  CSS. Esta elección no desactiva type checking ni lint.
- No hay OAuth, RBAC, `auth/me`, cliente HTTP ni endpoints consumidos.
- No hay datos ficticios permanentes ni mock APIs; los ejemplos de la página
  showcase son exclusivamente visuales.
- No se implementa dark mode ni un toggle de tema.
- Las animaciones se limitan a transiciones pequeñas, focus y overlays.
