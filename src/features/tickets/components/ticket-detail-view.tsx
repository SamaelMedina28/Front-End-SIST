"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isTicketPriority, isTicketStatus, ticketStatusLabel } from "@/lib/constants/presentation";
import { ApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import { useTicket, useTicketEvents } from "../queries/tickets";
import { formatTicketDate } from "../utils/format-date";
import { TicketTimeline } from "./ticket-timeline";

function DetailSkeleton() {
  return <div aria-label="Cargando solicitud" className="grid gap-5" role="status">
    <div className="h-24 animate-pulse rounded-xl bg-muted" />
    <div className="grid gap-5 lg:grid-cols-2"><div className="h-52 animate-pulse rounded-xl bg-muted" /><div className="h-52 animate-pulse rounded-xl bg-muted" /></div>
    <div className="h-64 animate-pulse rounded-xl bg-muted" />
  </div>;
}

function safeExternalUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function TicketDetailView({ ticketId }: { ticketId: string }) {
  const ticketQuery = useTicket(ticketId);
  const eventsQuery = useTicketEvents(ticketId, ticketQuery.isSuccess);

  if (ticketQuery.isPending) return <DetailSkeleton />;
  if (ticketQuery.isError) {
    const notFound = ticketQuery.error instanceof ApiError && ticketQuery.error.status === 404;
    const error = ticketQuery.error instanceof Error ? ticketQuery.error : new Error("Ocurrió un error inesperado.");
    return <div className="space-y-5"><PageHeader title={notFound ? "Solicitud no encontrada" : "No se pudo cargar la solicitud"} /><ErrorState title={notFound ? "No encontramos este ticket" : "Error al consultar el ticket"} message={error.message} requestId={ticketQuery.error instanceof ApiError ? ticketQuery.error.requestId : undefined} onRetry={() => { void ticketQuery.refetch(); }} action={<Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/tickets">Volver a mis tickets</Link>} /></div>;
  }

  const ticket = ticketQuery.data;
  const downloadUrl = safeExternalUrl(ticket.software?.downloadUrl);
  return <article className="grid min-w-0 gap-6">
    <PageHeader
      breadcrumb={<Link className="inline-flex items-center gap-1 hover:text-foreground" href="/tickets"><ArrowLeft aria-hidden="true" size={14} /> Mis tickets</Link>}
      title={ticket.title}
      description="Detalle de la solicitud de soporte técnico."
      actions={<span className="rounded-md border bg-muted px-3 py-2 font-mono text-sm font-semibold">{ticket.code}</span>}
    />
    <section aria-label="Estado y prioridad" className="flex flex-wrap items-center gap-2">
      {isTicketStatus(ticket.status) ? <StatusBadge status={ticket.status} /> : <span className="rounded-md border px-2.5 py-1 text-xs">{ticketStatusLabel(ticket.status)}</span>}
      {isTicketPriority(ticket.priority) ? <PriorityBadge priority={ticket.priority} /> : <span className="rounded-md border px-2.5 py-1 text-xs">{ticket.priority}</span>}
    </section>
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Descripción</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap break-words text-sm leading-6">{ticket.description}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Clasificación y ubicación</CardTitle></CardHeader><CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Categoría</dt><dd className="mt-1 font-medium">{ticket.category.name ?? "—"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Subcategoría</dt><dd className="mt-1 font-medium">{ticket.subcategory?.name ?? "—"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Edificio</dt><dd className="mt-1 font-medium">{ticket.location.building ?? "—"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Aula / espacio</dt><dd className="mt-1 font-medium">{ticket.location.room ?? "—"}</dd></div>
        </dl>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Seguimiento</CardTitle></CardHeader><CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Técnico asignado</dt><dd className="mt-1 font-medium">{ticket.assignee?.fullName ?? "Sin asignar"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Creado</dt><dd className="mt-1 font-medium">{formatTicketDate(ticket.createdAt)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Última actualización</dt><dd className="mt-1 font-medium">{formatTicketDate(ticket.updatedAt)}</dd></div>
          {ticket.assignedAt && <div><dt className="text-xs text-muted-foreground">Asignado</dt><dd className="mt-1 font-medium">{formatTicketDate(ticket.assignedAt)}</dd></div>}
          {ticket.completedAt && <div><dt className="text-xs text-muted-foreground">Finalizado</dt><dd className="mt-1 font-medium">{formatTicketDate(ticket.completedAt)}</dd></div>}
          {ticket.cancelledAt && <div><dt className="text-xs text-muted-foreground">Cancelado</dt><dd className="mt-1 font-medium">{formatTicketDate(ticket.cancelledAt)}</dd></div>}
        </dl>
      </CardContent></Card>
      {ticket.software && <Card><CardHeader><CardTitle>Detalles del software solicitado</CardTitle></CardHeader><CardContent><dl className="grid gap-4 sm:grid-cols-2">
        {ticket.software.name && <div><dt className="text-xs text-muted-foreground">Software</dt><dd className="mt-1 font-medium">{ticket.software.name}</dd></div>}
        {ticket.software.version && <div><dt className="text-xs text-muted-foreground">Versión</dt><dd className="mt-1 font-medium">{ticket.software.version}</dd></div>}
        {ticket.software.downloadUrl && <div className="min-w-0"><dt className="text-xs text-muted-foreground">Enlace de descarga</dt><dd className="mt-1 break-all text-sm">{downloadUrl ? <a className="text-primary underline" href={downloadUrl} rel="noreferrer" target="_blank">{ticket.software.downloadUrl}</a> : ticket.software.downloadUrl}</dd></div>}
        {ticket.software.coordinationApprovalReference && <div><dt className="text-xs text-muted-foreground">Referencia de autorización</dt><dd className="mt-1 font-medium">{ticket.software.coordinationApprovalReference}</dd></div>}
      </dl></CardContent></Card>}
      {ticket.inventoryItem && <Card><CardHeader><CardTitle>Equipo relacionado</CardTitle></CardHeader><CardContent><dl className="grid gap-4 sm:grid-cols-3">
        {ticket.inventoryItem.type && <div><dt className="text-xs text-muted-foreground">Tipo</dt><dd className="mt-1 font-medium">{ticket.inventoryItem.type}</dd></div>}
        {ticket.inventoryItem.model && <div><dt className="text-xs text-muted-foreground">Modelo</dt><dd className="mt-1 font-medium">{ticket.inventoryItem.model}</dd></div>}
        {ticket.inventoryItem.assetCode && <div><dt className="text-xs text-muted-foreground">Código patrimonial</dt><dd className="mt-1 font-medium">{ticket.inventoryItem.assetCode}</dd></div>}
      </dl></CardContent></Card>}
    </div>
    {eventsQuery.isPending ? <div aria-label="Cargando actividad" className="h-52 animate-pulse rounded-xl bg-muted" role="status" />
      : <TicketTimeline events={eventsQuery.data ?? []} error={eventsQuery.isError ? eventsQuery.error instanceof Error ? eventsQuery.error : new Error("No se pudo cargar la actividad.") : undefined} onRetry={() => { void eventsQuery.refetch(); }} />}
  </article>;
}
