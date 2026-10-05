import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { formatTicketDate } from "../utils/format-date";
import type { TicketEvent } from "../api";
import { ticketStatusLabel } from "@/lib/constants/presentation";

const eventLabels = {
  CREATED: "Solicitud creada",
  ASSIGNED: "Solicitud asignada",
  UNASSIGNED: "Asignación retirada",
  STATUS_CHANGED: "Estado actualizado",
  PRIORITY_CHANGED: "Prioridad actualizada",
  CANCELLED: "Solicitud cancelada",
} satisfies Record<TicketEvent["type"], string>;

export function TicketTimeline({ events, error, onRetry }: { events: TicketEvent[]; error?: Error; onRetry?: () => void }) {
  return <Card>
    <CardHeader><CardTitle>Actividad de la solicitud</CardTitle></CardHeader>
    <CardContent>
      {error ? <ErrorState title="No se pudo cargar la actividad" message={error.message} requestId={"requestId" in error && typeof error.requestId === "string" ? error.requestId : undefined} onRetry={onRetry} />
        : events.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay eventos para mostrar.</p>
          : <ol aria-label="Cronología de la solicitud" className="grid gap-0">
            {events.map((event, index) => <li className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 pb-6 last:pb-0" key={event.id}>
              <span aria-hidden="true" className="relative mt-1 grid size-5 place-items-center rounded-full border bg-background"><span className="size-2 rounded-full bg-primary" />{index < events.length - 1 && <span className="absolute left-1/2 top-5 h-[calc(100%+0.25rem)] w-px -translate-x-1/2 bg-border" />}</span>
              <div className="min-w-0"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><h3 className="text-sm font-medium">{eventLabels[event.type]}</h3><time className="text-xs text-muted-foreground" dateTime={event.createdAt}>{formatTicketDate(event.createdAt)}</time></div>
                {event.actor?.fullName && <p className="mt-1 text-sm text-muted-foreground">{event.actor.fullName}</p>}
                {(event.fromStatus || event.toStatus) && <p className="mt-1 text-sm text-muted-foreground">{event.fromStatus ? ticketStatusLabel(event.fromStatus) : "—"} → {event.toStatus ? ticketStatusLabel(event.toStatus) : "—"}</p>}
              </div>
            </li>)}
          </ol>}
    </CardContent>
  </Card>;
}
