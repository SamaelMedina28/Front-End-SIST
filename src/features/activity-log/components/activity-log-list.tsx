"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/api-error";
import { formatTicketDate } from "@/features/tickets/utils/format-date";
import { cn } from "@/lib/utils";
import { useActivityLogs } from "../queries/activity-log";
import type { ActivityLogFilters, ActivityLogStatus } from "../api";
import { activityLogStatusLabels } from "../utils/presentation";

function ActivityLogSkeleton() {
  return <div aria-label="Cargando bitácora" className="grid gap-3" role="status">{[0, 1, 2, 3].map((row) => <div className="h-24 animate-pulse rounded-xl bg-muted" key={row} />)}</div>;
}

function statusTone(status: ActivityLogStatus) {
  return status === "COMPLETED" ? "success" : "warning";
}

export function ActivityLogList({ filters, role }: { filters: ActivityLogFilters; role: "SUPPORT" | "SUB_MANAGER" | "ADMIN" }) {
  const router = useRouter();
  const query = useActivityLogs(filters);
  if (query.isPending) return <ActivityLogSkeleton />;
  if (query.isError) return <ErrorState title="No se pudo cargar la bitácora" message={query.error instanceof Error ? query.error.message : "Error inesperado."} requestId={query.error instanceof ApiError ? query.error.requestId : undefined} onRetry={() => { void query.refetch(); }} />;
  const { entries, meta } = query.data;
  const queryString = (page: number) => {
    const next = new URLSearchParams();
    Object.entries({ ...filters, page }).forEach(([key, value]) => { if (value !== undefined && value !== "") next.set(key, String(value)); });
    return `/activity-log?${next.toString()}`;
  };
  return <section className="grid min-w-0 gap-5">
    <PageHeader title="Bitácora de servicio" description={role === "SUB_MANAGER" ? "Actividades registradas en tus áreas de soporte." : role === "ADMIN" ? "Consulta de registros de actividad de servicio." : "Registros de actividad disponibles para tus áreas de soporte."} actions={role === "SUB_MANAGER" ? <Link className={cn(buttonVariants({ variant: "primary" }))} href="/activity-log/new"><Plus aria-hidden="true" size={16} />Registrar actividad</Link> : undefined} />
    <form action="/activity-log" className="grid gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="activity-search">Buscar</label><Input defaultValue={filters.search ?? ""} id="activity-search" name="search" placeholder="Ticket, reportero o actividad" /></div>
      <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="activity-status">Estado</label><Select defaultValue={filters.status ?? ""} id="activity-status" name="status"><option value="">Todos</option>{Object.entries(activityLogStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
      <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="activity-ticket">Ticket ID</label><Input defaultValue={filters.ticketId ?? ""} id="activity-ticket" name="ticketId" placeholder="UUID del ticket" /></div>
      <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="activity-from">Desde</label><Input defaultValue={filters.from ?? ""} id="activity-from" name="from" type="date" /></div>
      <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="activity-to">Hasta</label><Input defaultValue={filters.to ?? ""} id="activity-to" name="to" type="date" /></div>
      <input name="pageSize" type="hidden" value={filters.pageSize ?? 20} />
      <div className="flex items-end gap-2"><Button type="submit" variant="secondary">Aplicar filtros</Button><Link className={cn(buttonVariants({ variant: "outline" }))} href="/activity-log">Limpiar</Link></div>
    </form>
    {!entries.length ? <EmptyState title={role === "SUPPORT" ? "No hay registros de bitácora disponibles en tus áreas." : "No hay registros de bitácora."} description="Prueba con otros filtros o vuelve más tarde." /> : <>
      <div className="hidden overflow-hidden rounded-xl border md:block"><table className="w-full text-left text-sm"><thead className="bg-muted text-xs text-muted-foreground"><tr><th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Actividad</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Participantes</th><th className="px-4 py-3">Tiempo</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y">{entries.map((entry) => <tr key={entry.id}><td className="px-4 py-3"><Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/activity-log/${entry.id}`}>{entry.ticket.code}</Link><p className="mt-1 max-w-60 truncate text-xs text-muted-foreground">{entry.ticket.title}</p></td><td className="max-w-md px-4 py-3"><p className="line-clamp-2">{entry.activity}</p></td><td className="whitespace-nowrap px-4 py-3">{formatTicketDate(entry.serviceStartedAt)}</td><td className="px-4 py-3">{entry.participants.map((person) => person.fullName).join(", ") || "—"}</td><td className="whitespace-nowrap px-4 py-3">{entry.timeSpentMinutes} min</td><td className="px-4 py-3"><Badge tone={statusTone(entry.status)}>{activityLogStatusLabels[entry.status]}</Badge></td></tr>)}</tbody></table></div>
      <ul className="grid gap-3 md:hidden">{entries.map((entry) => <li className="rounded-xl border bg-surface p-4" key={entry.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link className="font-semibold text-primary underline-offset-4 hover:underline" href={`/activity-log/${entry.id}`}>{entry.ticket.code} · {entry.ticket.title}</Link><p className="mt-1 text-xs text-muted-foreground">{formatTicketDate(entry.serviceStartedAt)}</p></div><Badge tone={statusTone(entry.status)}>{activityLogStatusLabels[entry.status]}</Badge></div><p className="mt-3 line-clamp-3 text-sm">{entry.activity}</p><p className="mt-3 text-xs text-muted-foreground">{entry.participants.map((person) => person.fullName).join(", ") || "Sin participantes"} · {entry.timeSpentMinutes} min</p></li>)}</ul>
      <nav aria-label="Paginación de bitácora" className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">Página {meta.page} de {meta.totalPages} · {meta.total} registros</p><div className="flex gap-2"><Button disabled={meta.page <= 1} onClick={() => router.push(queryString(meta.page - 1))} size="sm" variant="outline"><ChevronLeft aria-hidden="true" size={16} />Anterior</Button><Button disabled={meta.page >= meta.totalPages} onClick={() => router.push(queryString(meta.page + 1))} size="sm" variant="outline">Siguiente<ChevronRight aria-hidden="true" size={16} /></Button></div></nav>
    </>}
  </section>;
}
