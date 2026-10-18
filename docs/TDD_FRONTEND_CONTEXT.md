# Contexto frontend para la práctica TDD de tickets

Fecha de inspección: 2026-10-17 (America/Tijuana). Proyecto: Sistema Integral de Soporte Técnico FCQI — UABC.

## Alcance y procedencia de la evidencia

El módulo elegido es la **política de transiciones de Ticket**, confirmado por el usuario durante esta tarea. Este documento describe cómo el frontend existente representa sus estados y consume la operación del backend.

Las fuentes son el código del frontend, su contrato OpenAPI generado y las pruebas ya presentes. No se inspeccionó la implementación aislada de la práctica backend ni se recibieron registros de sus ciclos Red/Green/Refactor. Por ello, la matriz aquí descrita es la **matriz de presentación del frontend**, no una certificación de equivalencia con la política que finalmente pruebe el backend.

No se afirma que el frontend se haya desarrollado mediante TDD. La ejecución actual de pruebas no demuestra que estas se escribieran antes que la implementación. No se reconstruyen fechas, commits ni una cronología histórica. Esta tarea no añade features ni modifica reglas, código funcional o pruebas.

## Rutas y componentes implicados

Los grupos `(authenticated)` organizan archivos de Next y no forman parte de la URL.

| Ruta visible | Archivo de ruta | Relación con la política |
| --- | --- | --- |
| `/tickets` | `src/app/(authenticated)/tickets/page.tsx` | Lista/cola compartida, filtro de estado, etiquetas y acceso al detalle. |
| `/tickets/[id]` | `src/app/(authenticated)/tickets/[id]/page.tsx` | Estado actual, controles de transición, confirmaciones, errores e historial. Es la pantalla principal de la evidencia. |
| `/dashboard` | `src/app/(authenticated)/dashboard/page.tsx` | Resumen dependiente del rol; su caché se invalida tras cambiar un ticket. No es el punto de envío del PATCH. |

| Componente o fuente | Archivo | Responsabilidad |
| --- | --- | --- |
| `TicketListView`, `TicketListExperience` y `Filters` | `src/features/tickets/components/ticket-list-view.tsx` | Lista según rol y filtro `status` serializado en la URL. Filtrar no cambia el estado. |
| `TicketListItems` | `src/features/tickets/components/ticket-list-items.tsx` | Muestra `StatusBadge` en tabla y tarjetas móviles. |
| `TicketDetailView` | `src/features/tickets/components/ticket-detail-view.tsx` | Consulta detalle y eventos; decide qué panel de acciones montar según el rol. |
| `SupportTicketActions` | `src/features/tickets/components/support-ticket-actions.tsx` | Matriz UX, área/asignación, botones de estado, confirmaciones, nota, bloqueo local durante envío y resultado. Compartido con ADMIN mediante `policy="admin"`. |
| `AdminTicketManagement` | `src/features/tickets/components/admin-ticket-management.tsx` | Panel administrativo adyacente de asignación/prioridad. El cambio de estado lo hace `SupportTicketActions`, no este panel. |
| `ConfirmDialog` → `AlertDialog` → `DialogContent` | `src/components/shared/confirm-dialog.tsx`, `src/components/ui/alert-dialog.tsx`, `src/components/ui/dialog.tsx` | Confirmar finalización o cancelación; botones deshabilitados mientras la mutación está pendiente. |
| `StatusBadge` | `src/components/shared/status-badge.tsx` | Traducción, icono y color del estado; no valida transiciones. |
| `ticketStatusLabels`, `ticketStatusTones`, `ticketStatusLabel` | `src/lib/constants/presentation.ts` | Mapeo de enums a texto/tonos visuales; fallback textual para valores desconocidos en detalle/timeline. |
| `TicketTimeline` | `src/features/tickets/components/ticket-timeline.tsx` | Representa eventos recibidos de la API, actor, fecha y estados anterior/nuevo. |
| `routeAccess` | `src/components/layout/navigation.ts` | Acceso UX a rutas; no constituye autorización del API. |

## TicketStatus y matriz de presentación

`src/types/api.ts` deriva el estado de `TicketListItem["status"]`. En `src/features/tickets/api.ts`, el estado usado para el PATCH se deriva de `TicketStatusInput["status"]`. Ambos proceden de `src/types/api.generated.ts`.

| Enum enviado/recibido | Texto mostrado |
| --- | --- |
| `OPEN` | Abierto |
| `IN_REVIEW` | En revisión |
| `IN_PROGRESS` | En proceso |
| `COMPLETED` | Finalizado |
| `CANCELLED` | Cancelado |

La constante `transitions` está en `src/features/tickets/components/support-ticket-actions.tsx:15`. Se utiliza para construir los botones de avance disponibles. La matriz no se modificó en esta tarea.

| Estado actual | Destinos que ofrece la UI |
| --- | --- |
| `OPEN` | `IN_REVIEW`, `IN_PROGRESS`, `CANCELLED` |
| `IN_REVIEW` | `IN_PROGRESS`, `CANCELLED` |
| `IN_PROGRESS` | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | Ninguno; terminal |
| `CANCELLED` | Ninguno; terminal |

Un estado desconocido no tiene destinos en la matriz y no produce botones de cambio. No hay controles de reapertura ni retroceso. La UI de ADMIN usa esta misma matriz: «puede operar globalmente» no significa «puede realizar cualquier transición».

La función `isTerminal` reconoce `COMPLETED` y `CANCELLED`. En esos casos el panel muestra «Este ticket ya está finalizado.» y no ofrece cambios. Los controles administrativos de asignación y prioridad también consideran esos estados terminales.

## Comportamiento por rol y autoridad final

| Rol | Experiencia de cambio de estado |
| --- | --- |
| `USER` | Consulta los tickets que autorice el servidor, su estado y su timeline. `TicketDetailView` no monta controles técnicos/administrativos para este rol. |
| `SUPPORT` | Botones solo en tickets activos de una de sus áreas y asignados a su propia cuenta. Si está sin asignar y es elegible, ofrece «Tomar ticket». Si pertenece a otro técnico o está fuera de sus áreas, informa solo lectura/acciones ocultas. |
| `SUB_MANAGER` | Reutiliza los controles técnicos y las mismas condiciones de área y asignación propia de SUPPORT. No obtiene el modo global de ADMIN para cambiar estado. |
| `ADMIN` | `TicketDetailView` monta `SupportTicketActions policy="admin"`; no exige asignación propia ni coincidencia de áreas. Mantiene matriz UX, confirmación de terminales y nota de cancelación. |

El modo ADMIN exige tanto `policy === "admin"` como `user.role === "ADMIN"`. La separación de paneles por rol se hace en `TicketDetailView`; no debe presentarse la ocultación de botones como una barrera de seguridad.

**El backend es la autoridad final** sobre sesión, permisos, áreas, asignación, estado persistido, transición válida, validación del motivo, concurrencia e idempotencia. El cliente puede mostrar información desactualizada: que un botón exista no garantiza que el servidor acepte la operación. Una petición construida fuera de la UI también debe ser validada por el servidor.

## Endpoint real y contrato consumido

Función: `changeTicketStatus`, en `src/features/tickets/api.ts:55`.

- Método y path: `PATCH /api/v1/tickets/{id}/status`.
- `id`: identificador real del ticket, como parámetro del path.
- Body: `TicketStatusInput`, con `status` y `note?`.
- Cabecera enviada por este flujo: `Idempotency-Key`.
- Cliente: `getBrowserClient()`, en `src/lib/api/browser-client.ts`, basado en `openapi-fetch` y `credentials: "include"`.
- Origen: se obtiene de `NEXT_PUBLIC_API_URL`; el path generado ya contiene `/api/v1`. No se presupone un dominio de despliegue ni se incluyen secretos de entorno.

El contrato guardado en `src/types/api.generated.ts:1626` documenta a ADMIN global y a SUPPORT/SUB_MANAGER con asignación propia y área. La respuesta 200 contiene `TicketStatusResult`: `id`, `code`, `status`, `updatedAt`, dentro de la envoltura estándar. También documenta errores 401, 403, 404, 409 y 422.

`TicketStatusInput` (`src/types/api.generated.ts:3541`) enumera los cinco estados. Aunque `note` es opcional en TypeScript, su descripción dice «Obligatoria al cancelar». Esa condición se valida en la UX y sigue sujeta a la validación backend. El contrato consultado no expone una matriz de aristas permitidas; no prueba por sí solo que cada arista de la matriz local coincida con el módulo TDD backend.

Otros endpoints relacionados:

| Endpoint | Uso |
| --- | --- |
| `GET /api/v1/tickets` | Listado y filtro por estado. |
| `GET /api/v1/tickets/{id}` | Fuente del estado/asignación/área que representa el detalle. |
| `GET /api/v1/tickets/{id}/events` | Fuente del timeline autoritativo. |
| `GET /api/v1/dashboard` | Métricas consultadas otra vez tras invalidación. |
| `GET /api/v1/auth/me` | Usuario actual y rol, a través de `useCurrentUser`. |
| `POST /api/v1/tickets/{id}/assign-self` | Flujo previo de autoasignación, con body `{}`; no es la transición de estado ni envía `Idempotency-Key`. |

No se regeneró el contrato ni se realizaron mutaciones contra un backend real para producir esta evidencia.

## Hooks, consultas y mutaciones

| Hook/función | Archivo | Comportamiento relevante |
| --- | --- | --- |
| `useCurrentUser` | `src/features/auth/queries/current-user.ts` | Aporta la sesión/rol para presentar controles. |
| `useTickets`, `useTicket`, `useTicketEvents` | `src/features/tickets/queries/tickets.ts` | Listado, detalle y eventos. Los eventos se habilitan al tener un detalle consultado exitosamente. |
| `useChangeTicketStatus` | `src/features/tickets/mutations/support-actions.ts:18` | Llama al PATCH; `retry: false`; invalida contexto tras éxito y también ante un 409. |
| `useAssignTicketToSelf` | `src/features/tickets/mutations/support-actions.ts:9` | Autoasignación previa, sin retry automático; invalida contexto al éxito. |
| `invalidateTicketContext` | `src/features/tickets/mutations/invalidate-ticket-context.ts` | Invalida lista, detalle, eventos y dashboard. |
| `useUserDashboard`, `useSupportDashboard`, `useAdminDashboard` | `src/features/tickets/queries/dashboard.ts` | Consultas dependientes de rol bajo el prefijo de caché `["dashboard"]`. |
| `requestApi`, `ApiError` | `src/lib/api/request.ts`, `src/lib/api/api-error.ts` | Desenvuelven éxito y conservan status, código, mensaje, fields y requestId de errores. |

Claves invalidadas: `["tickets"]`, `["tickets", ticketId]`, `["tickets", ticketId, "events"]` y `["dashboard"]`. TanStack Query vuelve a consultar las queries activas; las inactivas quedan invalidadas para lecturas posteriores. No se escribe un estado/evento optimista en la caché.

## Cancelación, confirmación e Idempotency-Key

Los cambios a `IN_REVIEW` y `IN_PROGRESS` se envían desde su botón. `COMPLETED` abre «Completar ticket» y requiere «Confirmar finalización». `CANCELLED` abre «Cancelar ticket», solicita «Nota de cancelación» y requiere «Confirmar cancelación».

Una nota vacía o formada solo por espacios detiene el envío y muestra «Escribe una nota para cancelar el ticket.». La nota se recorta con `trim()` antes de incluirla en el body. Para otros destinos el body solo contiene `status`.

`submitStatus` genera `globalThis.crypto.randomUUID()` por cada intento aceptado por el control local. La clave pasa a la mutación y luego a la cabecera del PATCH sin regenerarse en el cliente HTTP. `pendingRef` bloquea una segunda interacción durante el envío y los botones muestran estado pendiente.

El contrato marca la cabecera como opcional y describe conservación de la respuesta por 24 horas; el flujo frontend siempre la envía. La persistencia/reproducción de esa respuesta pertenece al backend y no fue comprobada aquí. No hay retry automático del PATCH ni persistencia de la clave para reintentos manuales: otro intento genera otra clave. No se debe afirmar que las pruebas frontend demuestren deduplicación backend, replay, expiración o protección frente a todos los reenvíos después de una pérdida de respuesta.

## Estados loading, error y success

| Momento | Resultado visible |
| --- | --- |
| Carga de detalle | Skeleton con nombre accesible «Cargando solicitud». |
| Carga inicial de eventos | Skeleton «Cargando actividad». |
| PATCH pendiente | Botones deshabilitados y «Actualizando estado…»; la confirmación usa «Procesando…». Se bloquea el envío duplicado local. |
| PATCH correcto | Mensaje «Estado actualizado.»; cierre de confirmación; invalidación y nueva lectura del estado/eventos. |
| Error de PATCH | Mensaje real normalizado y `requestId` cuando existe, dentro de una alerta; botón «Volver a consultar el ticket». |
| Conflicto 409 de estado | Además de presentar el error, invalida lista/detalle/eventos/dashboard para obtener la situación vigente. No reenvía el PATCH automáticamente. |
| Error 403/404 del detalle | «Acceso restringido» o «No encontramos este ticket», con mensaje, referencia disponible y posibilidad de reconsulta. |
| Error de eventos | «No se pudo cargar la actividad», con reintento de lectura, conservando el resto del detalle. |
| Eventos vacíos | «Todavía no hay eventos para mostrar.». |

Al terminar el intento de cambio de estado, `onSettled` libera el bloqueo, cierra el diálogo y limpia la nota, tanto en éxito como en error. Esto describe la implementación presente; no se afirma que preserve un borrador de cancelación después de un error.

La política de GET (`shouldRetryQuery`) permite un reintento para red/5xx. Es distinta de la política del PATCH, cuyo retry está desactivado.

## Resultado en el timeline

Después de un PATCH exitoso o de un conflicto 409 se invalida la consulta de eventos. `TicketTimeline` recibe el nuevo arreglo de `GET /api/v1/tickets/{id}/events` y mantiene el orden entregado por la API; no ordena localmente ni fabrica eventos.

Para `STATUS_CHANGED`, muestra «Estado actualizado», el nombre del actor si existe, fecha/hora y el paso entre `fromStatus` y `toStatus` traducidos. Las fechas usan `es-MX` y `America/Tijuana`, mediante `src/features/tickets/utils/format-date.ts`.

El enum también contempla `CANCELLED`, que se representa como «Solicitud cancelada». El frontend no determina si una cancelación debe producir ese evento, un `STATUS_CHANGED` o ambos: muestra lo que entregue el servidor.

**Límite visible:** el timeline no renderiza la nota de cancelación ni `metadata`. `TicketEvent.metadata` está generado como `Record<string, never>`; no hay un campo de motivo utilizable documentado en ese tipo. La captura del motivo debe hacerse en la confirmación antes del envío o en evidencia real del request/backend. No afirmar que el motivo se ve después en la cronología.

## Pruebas existentes de integración/frontend

Todas las siguientes pruebas ya existían antes de esta tarea. Las pruebas UI usan Vitest, Testing Library, jsdom y respuestas de `fetch` simuladas; no son ejecuciones de extremo a extremo contra Express. Las pruebas de etiquetas y normalización son unitarias complementarias. Los títulos se transcriben literalmente y se distingue el nombre de la prueba de lo que realmente comprueba.

### Controles técnicos — tests/support-module-ui.test.tsx

Suite: `SUPPORT ticket actions`.

| Nombre exacto de la prueba | Comportamiento comprobado |
| --- | --- |
| `confirms self-assignment, sends an empty body, and invalidates related queries` | Confirma autoasignación, POST con `{}`, sin cabecera de idempotencia, mensaje de éxito e invalidación de lista/detalle/eventos/dashboard. |
| `blocks duplicate assignment while pending and preserves the backend 409 with refetch` | Deshabilita confirmación pendiente, conserva el error simulado 409, observa un único POST y permite reconsulta. |
| `shows status controls only for the current assignee and sends status with a fresh idempotency key` | Envía `IN_REVIEW` con UUID, usa otra clave en otro intento, invalida dashboard y oculta controles cuando está asignado a otro técnico. |
| `locks status submission while pending and shows the backend conflict without retry` | Deshabilita botones de estado, presenta el 409 simulado `INVALID_TRANSITION`, comprueba un solo PATCH y el callback de reconsulta. |
| `requires a cancellation note, confirms terminal change, and sends the generated header` | Rechaza confirmación sin nota; envía `CANCELLED` con nota y UUID, y muestra éxito. El caso probado es cancelación, no confirmación de `COMPLETED`. |
| `keeps terminal tickets read-only and never exposes support actions to USER` | Usa un fixture `COMPLETED`, comprueba aviso terminal y ausencia de «Tomar ticket»; comprueba ausencia de acciones técnicas en la vista USER. No recorre ambos terminales. |
| `hides actions when the ticket area is not among the support user's areas` | Mensaje de área incompatible; ausencia de «Tomar ticket» y «Marcar en revisión». |

En la suite `SUPPORT queue` del mismo archivo:

| Nombre exacto | Comportamiento comprobado |
| --- | --- |
| `shows an empty queue to SUB_MANAGER through the shared SUPPORT experience` | SUB_MANAGER usa la cola técnica compartida y su estado vacío. No envía un PATCH de estado como SUB_MANAGER. |
| `shows queue loading and backend error states` | Skeleton y error de listado. Es evidencia de lectura, no de validación de transiciones. |

### Administración — tests/admin-tickets-ui.test.tsx

Suite: `ADMIN ticket controls`.

| Nombre exacto de la prueba | Comportamiento comprobado |
| --- | --- |
| `lets ADMIN change status without assigned-to-self and retains the Idempotency-Key` | ADMIN envía `IN_PROGRESS` para un ticket asignado a otra cuenta; body correcto y cabecera UUID. |
| `confirms unassignment and sends DELETE; hides administrative actions from SUPPORT` | Confirmación/DELETE de desasignación y ausencia del panel administrativo para SUPPORT. Complementa la separación de roles; no prueba una transición de estado. |
| `lists active compatible SUPPORT and SUB_MANAGER candidates, reassigns by PUT, and patches priority with reason` | Asignación/prioridad administrativas e invalidación compartida; esas operaciones no llevan `Idempotency-Key`. No equivale al PATCH de estado como SUB_MANAGER. |

### Detalle y cronología — tests/user-module-ui.test.tsx

| Suite | Nombre exacto de la prueba | Comportamiento comprobado |
| --- | --- | --- |
| `ticket detail and event timeline` | `renders fields from the detail response and the chronological event feed` | Renderiza detalle y un evento simulado `CREATED` con destino `OPEN`; no comprueba `STATUS_CHANGED` después de un PATCH ni ordenación de varios eventos. |
| `ticket detail and event timeline` | `handles a missing ticket and an empty event response` | Mensaje de historial vacío y detalle 404 con requestId. |
| `USER ticket listing` | `uses USER empty state and gives SUB_MANAGER the shared technical queue` | Diferencia el estado vacío de USER de la cola compartida de SUB_MANAGER. |

### Etiquetas — tests/presentation.test.ts

Suite: `presentation labels`.

| Nombre exacto de la prueba | Comportamiento comprobado |
| --- | --- |
| `translates ticket statuses without changing backend enum keys` | Mapea los cinco estados a sus textos españoles conservando sus claves. |
| `keeps every status mapped to a semantic tone` | Todos los estados tienen una clave equivalente en el mapeo de tonos. |
| `translates roles while preserving their keys` | Traduce USER, SUPPORT, SUB_MANAGER y ADMIN sin alterar enums. |

### Errores y reintentos — tests/api-integration.test.ts

| Suite | Nombre exacto de la prueba | Comportamiento comprobado |
| --- | --- | --- |
| `API response normalization` | `preserves backend error fields, requestId, status, code, and message` | Conservación de datos de un error simulado 422. |
| `API response normalization` | `turns an HTTP error response into ApiError` | Normalización de respuesta HTTP fallida. |
| `API response normalization` | `unwraps a successful backend envelope` | Extracción de `data` de una respuesta exitosa. |
| `API response normalization` | `classifies fetch failures as network errors and preserves the cause` | Clasificación de fallo de red simulado. |
| `query retry policy` | `retries one time for network failures and server errors` | Política de lectura con un reintento, no del PATCH. |
| `query retry policy` | `does not retry client errors or unknown failures` | Sin reintentos de consulta ante errores 401/422 o desconocidos. |

### Navegación por rol — tests/rbac.test.ts

Suite: `role-based navigation and route access`.

La prueba parametrizada tiene como título fuente `uses the OpenAPI role matrix for %s` y produce los nombres exactos `uses the OpenAPI role matrix for USER`, `uses the OpenAPI role matrix for SUPPORT`, `uses the OpenAPI role matrix for SUB_MANAGER` y `uses the OpenAPI role matrix for ADMIN`. Verifica la matriz de navegación/acceso UX, incluida `/tickets`. No comprueba autorización del servidor.

### Límites de las pruebas encontradas

No se identificó una prueba exhaustiva de todas las aristas permitidas/prohibidas, de PATCH ejecutado con rol SUB_MANAGER, de confirmación y envío `COMPLETED`, ni del recorrido PATCH → reconsulta → evento `STATUS_CHANGED` mostrado. El fixture de terminales cubre `COMPLETED`, no ambos terminales. Las pruebas no validan persistencia/replay durante 24 horas.

Estos son límites de cobertura/evidencia, no demostraciones de un fallo funcional. No se añadieron pruebas ni se reinterpretaron las existentes como ciclos TDD.

## Cinco ciclos TDD realizados en backend

Esta sección separa la evidencia de la práctica backend de las pruebas frontend anteriores. **Este documento no acredita que cinco ciclos hayan concluido**, ni identifica sus pruebas o su cronología, porque no se recibieron esos registros.

El reporte backend debe aportar, para cada uno de sus cinco ciclos reales, el requisito, nombre/archivo de prueba, ejecución fallida Red, implementación que produce Green, refactorización efectivamente realizada (si corresponde) y evidencias verificables de ese orden. Solo con ese material se podrá vincular cada comportamiento de backend a la operación descrita aquí.

Una suite frontend que hoy pasa no sustituye ese material, no cuenta como uno de los cinco ciclos y no prueba retrospectivamente que el frontend se construyó con TDD.

## Capturas manuales recomendadas

No se crearon capturas ni se simularon pantallas como evidencia. Usar sesiones autorizadas y tickets de prueba reales del entorno académico. Las operaciones terminales deben hacerse sobre tickets destinados a la demostración.

| Captura | Pantalla/precondición | Qué debe quedar visible |
| --- | --- | --- |
| 1. Ticket abierto | `/tickets/[id]`, `OPEN`, SUPPORT o SUB_MANAGER asignado y área compatible | Código del ticket, «Abierto», «Marcar en revisión», «Iniciar atención», «Cancelar ticket». |
| 2. Revisión | Mismo detalle, `IN_REVIEW`, asignación compatible | «En revisión», opciones para iniciar o cancelar; sin retroceso a OPEN. |
| 3. Atención | Detalle `IN_PROGRESS` | «En proceso», «Completar ticket» y «Cancelar ticket». |
| 4. Confirmación de finalización | Abrir «Completar ticket» en el caso anterior | Diálogo y «Confirmar finalización» antes de confirmar. |
| 5. Cancelación con motivo | Otro ticket activo de prueba; abrir cancelación | Campo «Nota de cancelación», validación vacía si se demuestra, y motivo escrito antes del envío. |
| 6. Terminal | Detalle real `COMPLETED`; opcionalmente repetir con `CANCELLED` | Badge, aviso «Este ticket ya está finalizado.» y ausencia de botones de transición. |
| 7. Timeline actualizado | Tras un cambio real, revisar «Actividad de la solicitud» | Evento real `STATUS_CHANGED` representado como «Estado actualizado», actor, fecha y estados anterior/nuevo. Para cancelación registrar el tipo que efectivamente devuelva la API. |
| 8. Diferencias por rol | USER; SUPPORT asignado a otra cuenta/fuera de área; ADMIN con ticket asignado a un tercero | Ausencia o presencia real de controles según el caso. Incluir SUB_MANAGER con asignación propia para completar la evidencia de su ruta compartida. |
| 9. Request de integración | DevTools/Network en un cambio autorizado | Método PATCH, path real, body y `Idempotency-Key`, respuesta y GET posterior de eventos. Ocultar cookies, tokens y datos personales. |
| 10. Rechazo backend, si se reproduce | Un conflicto real de un ticket de demostración, coordinado con backend | Mensaje y requestId, sin presentar un rechazo simulado como evidencia real. |

Las capturas frontend muestran la integración y UX actuales, no el orden histórico de los cinco ciclos TDD. Para correlación usar el mismo código de ticket y las referencias reales disponibles.

## Discrepancias y límites encontrados

1. El contrato local define roles, estados y requisitos condicionales, pero no las aristas de transición. Falta contrastar la matriz UX con la implementación/evidencia final del módulo backend antes de afirmar concordancia completa.
2. La nota se envía al cancelar, pero el timeline actual no muestra ese motivo. No prometer una captura del motivo persistido en esa pantalla.
3. `Idempotency-Key` es opcional en el tipo generado y siempre se envía en este flujo; cada nuevo intento manual tiene una clave nueva. Envío de clave no demuestra replay/deduplicación del servidor.
4. Las pruebas existentes tienen los límites de cobertura señalados arriba. Sus títulos no deben usarse para atribuirles casos que no ejecutan.
5. `docs/ADMIN_TICKETS_MODULE.md` dice «No hay locks frontend», pero `SupportTicketActions` contiene `pendingRef` y deshabilita botones para impedir doble envío. Esa redacción debe entenderse con precisión: hay un bloqueo local de interacción; no equivale a un bloqueo de concurrencia en backend. Se registra la diferencia documental sin cambiar comportamiento.

No se confirmó un bug funcional contra la política final backend en esta inspección; tampoco se certificó aceptación con sesiones reales. No se modificó la matriz ni el flujo para corregir supuestos.

## Verificación de esta tarea

| Comando solicitado | Resultado |
| --- | --- |
| `pnpm lint` | PASS, código de salida 0. |
| `pnpm exec tsc --noEmit` | PASS, código de salida 0. |
| `pnpm test` | PASS: 18 archivos, 130 pruebas. |
| `pnpm build` | PASS, código de salida 0; Next.js 16.3.8/Webpack, compilación y comprobación de TypeScript correctas, 19 páginas generadas. |
| `git diff --check` | PASS, código de salida 0; revisión adicional del documento nuevo mediante diff sin índice. |

Total verificado de la suite frontend: **130 pruebas**; este número incluye otros módulos y no representa pruebas exclusivas de transiciones ni ciclos TDD. No se ejecutaron pruebas backend.

Archivo de evidencia creado: `docs/TDD_FRONTEND_CONTEXT.md`. Sin commit ni push. Se conserva la modificación previa de `next-env.d.ts` y se descarta únicamente el cambio de `tsconfig.tsbuildinfo` generado por las verificaciones.
