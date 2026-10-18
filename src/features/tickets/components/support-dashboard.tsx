"use client";

import { Activity, CircleCheck, Flame, Inbox } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/api-error";
import { useCurrentUser } from "@/features/auth/queries/current-user";
import { useSupportDashboard } from "../queries/dashboard";
import { isSupportArea, supportAreaLabel } from "../utils/support-area";
import { TicketListItems } from "./ticket-list-items";

function SupportDashboardSkeleton() {
  return <div aria-label="Cargando panel de soporte" className="grid gap-6" role="status">
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div className="h-36 animate-pulse rounded-xl bg-muted" key={item} />)}</div>
    <div className="h-72 animate-pulse rounded-xl bg-muted" />
  </div>;
}

export function SupportDashboardContent() {
  const query = useSupportDashboard(true);
  const { data: user } = useCurrentUser();

  if (query.isPending) return <SupportDashboardSkeleton />;
  if (query.isError) return <ErrorState message={query.error instanceof Error ? query.error.message : "No se pudo cargar el panel de soporte."} requestId={query.error instanceof ApiError ? query.error.requestId : undefined} onRetry={() => { void query.refetch(); }} />;

  const { stats, priorityTickets } = query.data;
  const areas = user?.supportAreas.filter(isSupportArea) ?? [];
  const noRelevantTickets = stats.unassigned === 0 && stats.mine === 0 && stats.highPriority === 0 && priorityTickets.length === 0;

  return <section className="grid min-w-0 gap-6">
    <PageHeader title="Panel de soporte" description="Tickets pendientes y métricas de tus áreas de soporte." />
    <div aria-label="Mis áreas de soporte" className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Tus áreas:</span>
      {areas.length ? areas.map((area) => <span className="rounded-full border bg-muted px-3 py-1 text-xs font-medium" key={area}>{supportAreaLabel(area)}</span>) : <span className="text-sm text-muted-foreground">Sin áreas configuradas</span>}
    </div>
    <div aria-label="Métricas de soporte" className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Sin asignar" value={String(stats.unassigned)} description="Tickets disponibles en tus áreas" icon={Inbox} />
      <MetricCard title="Asignados a mí" value={String(stats.mine)} description="Tickets bajo tu atención" icon={Activity} />
      <MetricCard title="Prioridad alta" value={String(stats.highPriority)} description="Tickets de prioridad alta" icon={Flame} />
      <MetricCard title="Completados hoy" value={String(stats.completedToday)} description="Según la zona horaria configurada" icon={CircleCheck} />
    </div>
    <section className="grid min-w-0 gap-4" aria-labelledby="priority-queue-title">
      <div><h2 className="text-lg font-semibold" id="priority-queue-title">Atención prioritaria</h2><p className="mt-1 text-sm text-muted-foreground">Tickets de alta prioridad que requieren tu atención.</p></div>
      {priorityTickets.length > 0 ? <TicketListItems showAssignee tickets={priorityTickets} />
        : <EmptyState title={noRelevantTickets ? "No hay solicitudes pendientes en tus áreas de soporte." : "No hay tickets prioritarios para mostrar."} description="Aquí aparecerán las nuevas solicitudes de tus áreas." />}
    </section>
  </section>;
}
