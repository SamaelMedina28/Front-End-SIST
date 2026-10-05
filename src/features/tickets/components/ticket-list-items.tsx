import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTicketDate } from "../utils/format-date";
import type { Ticket } from "../api";

function ticketLocation(ticket: Ticket) {
  return [ticket.location.building, ticket.location.room].filter(Boolean).join(" · ") || "—";
}

export function TicketListItems({ tickets, showAssignee = false }: { tickets: Ticket[]; showAssignee?: boolean }) {
  return <>
    <div className="hidden overflow-x-auto rounded-xl border bg-surface md:block">
      <Table>
        <caption className="sr-only">Tickets de soporte</caption>
        <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Título</TableHead><TableHead>Categoría</TableHead><TableHead>Ubicación</TableHead><TableHead>Prioridad</TableHead><TableHead>Estado</TableHead>{showAssignee && <TableHead>Asignación</TableHead>}<TableHead>Fecha</TableHead><TableHead><span className="sr-only">Acción</span></TableHead></TableRow></TableHeader>
        <TableBody>{tickets.map((ticket) => <TableRow key={ticket.id}>
          <TableCell className="whitespace-nowrap font-mono text-xs font-semibold">{ticket.code}</TableCell>
          <TableCell className="min-w-48 max-w-72"><span className="line-clamp-2 font-medium">{ticket.title}</span></TableCell>
          <TableCell>{ticket.category.name ?? "—"}</TableCell>
          <TableCell>{ticketLocation(ticket)}</TableCell>
          <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
          <TableCell><StatusBadge status={ticket.status} /></TableCell>
          {showAssignee && <TableCell>{ticket.assignee?.fullName ?? "Sin asignar"}</TableCell>}
          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatTicketDate(ticket.createdAt)}</TableCell>
          <TableCell><Link aria-label={`Ver ticket ${ticket.code}: ${ticket.title}`} className="inline-flex size-9 items-center justify-center rounded-md text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/tickets/${ticket.id}`}><ArrowRight aria-hidden="true" size={17} /></Link></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <ul aria-label="Tickets de soporte" className="grid gap-3 md:hidden">
      {tickets.map((ticket) => <li key={ticket.id}>
        <Link aria-label={`Ver ticket ${ticket.code}: ${ticket.title}`} className="grid min-w-0 gap-3 rounded-xl border bg-surface p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/tickets/${ticket.id}`}>
          <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs font-semibold text-muted-foreground">{ticket.code}</p><h2 className="mt-1 break-words font-semibold">{ticket.title}</h2></div><ArrowRight aria-hidden="true" className="mt-1 shrink-0 text-primary" size={18} /></div>
          <div className="flex flex-wrap items-center gap-2"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div className="min-w-0"><dt className="text-muted-foreground">Categoría</dt><dd className="truncate font-medium">{ticket.category.name ?? "—"}</dd></div>
            <div className="min-w-0"><dt className="text-muted-foreground">Ubicación</dt><dd className="truncate font-medium">{ticketLocation(ticket)}</dd></div>
            {showAssignee && <div className="min-w-0"><dt className="text-muted-foreground">Asignación</dt><dd className="truncate font-medium">{ticket.assignee?.fullName ?? "Sin asignar"}</dd></div>}
            <div className="col-span-2"><dt className="text-muted-foreground">Fecha</dt><dd className="font-medium">{formatTicketDate(ticket.createdAt)}</dd></div>
          </dl>
        </Link>
      </li>)}
    </ul>
  </>;
}
