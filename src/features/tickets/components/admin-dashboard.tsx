"use client";

import { ChartNoAxesColumnIncreasing, Inbox, PackageOpen, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/lib/api/api-error";
import { useAdminDashboard } from "../queries/dashboard";
import { supportAreaLabel } from "../utils/support-area";

const numberFormat = new Intl.NumberFormat("es-MX");

function AdminDashboardSkeleton() {
  return <div aria-label="Cargando panel administrativo" className="grid gap-6" role="status">
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div className="h-36 animate-pulse rounded-xl bg-muted" key={item} />)}</div>
    <div className="h-72 animate-pulse rounded-xl bg-muted" />
  </div>;
}

export function AdminDashboardContent() {
  const query = useAdminDashboard(true);
  if (query.isPending) return <AdminDashboardSkeleton />;
  if (query.isError) return <ErrorState title="No se pudo cargar el panel administrativo" message={query.error instanceof Error ? query.error.message : "Ocurrió un error inesperado."} requestId={query.error instanceof ApiError ? query.error.requestId : undefined} onRetry={() => { void query.refetch(); }} />;

  const { stats, technicianWorkload } = query.data;
  return <section className="grid min-w-0 gap-6">
    <PageHeader title="Panel administrativo" description="Resumen operativo actual de tickets, personal e inventario." />
    <div aria-label="Métricas administrativas" className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Tickets activos" value={numberFormat.format(stats.activeTickets)} description="Según el conteo global del backend" icon={ChartNoAxesColumnIncreasing} />
      <MetricCard title="Sin asignar" value={numberFormat.format(stats.unassigned)} description="Tickets sin técnico asignado" icon={Inbox} />
      <MetricCard title="Técnicos activos" value={numberFormat.format(stats.activeTechnicians)} description="Personal de soporte activo" icon={UsersRound} />
      <MetricCard title="Elementos de inventario" value={numberFormat.format(stats.inventoryItems)} description="Conteo administrativo informado por el backend" icon={PackageOpen} />
    </div>
    <section aria-labelledby="technician-workload-title" className="grid min-w-0 gap-4">
      <div><h2 className="text-lg font-semibold" id="technician-workload-title">Carga operativa actual por técnico</h2><p className="mt-1 text-sm text-muted-foreground">Estado actual de tickets activos y completados hoy, agregado por el backend.</p></div>
      {technicianWorkload.length === 0 ? <EmptyState title="No hay carga de técnicos para mostrar." description="La distribución aparecerá cuando el backend incluya personal de soporte." /> : <>
        <div className="hidden overflow-x-auto rounded-xl border bg-surface md:block">
          <table className="w-full min-w-[42rem] text-left text-sm"><caption className="sr-only">Carga operativa actual por técnico</caption><thead className="border-b bg-muted/50"><tr><th className="px-4 py-3 font-medium">Técnico</th><th className="px-4 py-3 font-medium">Áreas</th><th className="px-4 py-3 text-right font-medium">Tickets activos</th><th className="px-4 py-3 text-right font-medium">Completados hoy</th></tr></thead>
            <tbody className="divide-y">{technicianWorkload.map((technician) => <tr key={technician.userId}><th className="px-4 py-3 font-medium">{technician.name}</th><td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{technician.supportAreas.map((area) => <span className="rounded-full border bg-muted px-2 py-0.5 text-xs" key={area}>{supportAreaLabel(area)}</span>)}</div></td><td className="px-4 py-3 text-right tabular-nums">{numberFormat.format(technician.activeTickets)}</td><td className="px-4 py-3 text-right tabular-nums">{numberFormat.format(technician.completedToday)}</td></tr>)}</tbody>
          </table>
        </div>
        <ul aria-label="Carga operativa actual por técnico" className="grid gap-3 md:hidden">{technicianWorkload.map((technician) => <li className="grid min-w-0 gap-3 rounded-xl border bg-surface p-4" key={technician.userId}>
          <div><h3 className="break-words font-semibold">{technician.name}</h3><div className="mt-2 flex flex-wrap gap-1.5">{technician.supportAreas.map((area) => <span className="rounded-full border bg-muted px-2 py-0.5 text-xs" key={area}>{supportAreaLabel(area)}</span>)}</div></div>
          <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Tickets activos</dt><dd className="mt-1 font-semibold tabular-nums">{numberFormat.format(technician.activeTickets)}</dd></div><div><dt className="text-xs text-muted-foreground">Completados hoy</dt><dd className="mt-1 font-semibold tabular-nums">{numberFormat.format(technician.completedToday)}</dd></div></dl>
        </li>)}</ul>
      </>}
    </section>
  </section>;
}
