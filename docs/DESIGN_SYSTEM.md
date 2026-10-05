# Design System — FCQI / UABC

## Alcance

La interfaz es light, institucional, sobria y orientada a claridad. El
showcase temporal de `/design-system` se retiró del producto; los tokens y
componentes compartidos siguen documentados aquí y en `src/components/ui`.

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

El verde UABC es la identidad primaria y ahora domina la navegación lateral y
la barra superior; el ocre institucional destaca la navegación activa y el
borde de la barra. Fondo y superficies usan matices verde/crema para bajar el
blanco puro sin perder contraste ni legibilidad. El azul se reserva para
información y foco.

## Tipografía

La pila es `Inter`, `ui-sans-serif`, `system-ui`, sans-serif. No se incluyen
archivos propietarios de Proxima Nova ni una descarga externa de fuentes; el
sistema operativo proporciona el fallback.

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

`public/Logo-uabc.png` contiene el escudo institucional proporcionado en el
workspace y `AppLogo` lo reutiliza como imagen decorativa; el nombre accesible
del enlace identifica el sistema. No es una marca específica de FCQI. Mantener
el archivo de origen y sustituirlo solo si la institución proporciona un asset
FCQI autorizado.

## Decisiones y límites del paso 1

- El script `build` usa `next build --webpack`: el build Webpack pasa con
  TypeScript estricto, mientras que Turbopack falla en este entorno restringido
  al intentar crear un proceso que enlace un puerto durante el procesamiento de
  CSS. Esta elección no desactiva type checking ni lint.
- El showcase con datos de demostración se eliminó y no es una ruta del producto.
- No hay datos ficticios permanentes ni mock APIs en runtime; los fixtures
  sintéticos se limitan a pruebas.
- No se implementa dark mode ni un toggle de tema.
- Las animaciones se limitan a transiciones pequeñas, focus y overlays.
