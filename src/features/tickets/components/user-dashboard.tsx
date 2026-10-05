"use client";

import Link from "next/link";
import { CircleCheck, Clock3, Plus, TicketCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/api-error";
import { useCurrentUser } from "@/features/auth/queries/current-user";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { useUserDashboard } from "../queries/dashboard";
import { TicketListItems } from "./ticket-list-items";
import { SupportDashboardContent } from "./support-dashboard";

function DashboardSkeleton() {
  return <div className="grid gap-6" aria-label="Cargando tu panel" role="status">
    <div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div className="h-36 animate-pulse rounded-xl bg-muted" key={item} />)}</div>
    <div className="h-72 animate-pulse rounded-xl bg-muted" />
  </div>;
}

export function UserDashboardContent() {
  const query = useUserDashboard(true);
  if (query.isPending) return <DashboardSkeleton />;
  if (query.isError) return <ErrorState message={query.error instanceof Error ? query.error.message : "Ocurrió un error inesperado."} requestId={query.error instanceof ApiError ? query.error.requestId : undefined} onRetry={() => { void query.refetch(); }} />;

  const { stats, recentTickets } = query.data;
  const noTickets = recentTickets.length === 0 && stats.active === 0 && stats.inProgress === 0 && stats.completed === 0;
  return <section className="grid min-w-0 gap-6">
    <PageHeader title="Mi espacio" description="Resumen de tus solicitudes de soporte técnico." actions={<Link className={cn(buttonVariants({ variant: "primary" }))} href="/tickets/new"><Plus aria-hidden="true" size={17} />Crear ticket</Link>} />
    <div aria-label="Resumen de tickets" className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard title="Tickets activos" value={String(stats.active)} description="Solicitudes activas" icon={TicketCheck} />
      <MetricCard title="En proceso" value={String(stats.inProgress)} description="Actualmente en atención" icon={Clock3} />
      <MetricCard title="Finalizados" value={String(stats.completed)} description="Solicitudes completadas" icon={CircleCheck} />
    </div>
    <section className="grid min-w-0 gap-4" aria-labelledby="recent-tickets-title">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold" id="recent-tickets-title">Tickets recientes</h2><p className="mt-1 text-sm text-muted-foreground">Solicitudes proporcionadas por tu panel.</p></div><Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href="/tickets">Ver todos</Link></div>
      {noTickets ? <EmptyState title="Aún no tienes solicitudes de soporte." description="Cuando crees una solicitud, podrás consultar aquí su avance." action={<Link className={cn(buttonVariants({ variant: "primary", size: "sm" }))} href="/tickets/new"><Plus aria-hidden="true" size={16} />Crear ticket</Link>} />
        : recentTickets.length === 0 ? <EmptyState title="No hay tickets recientes" description="No hay solicitudes recientes para mostrar." />
          : <TicketListItems tickets={recentTickets} />}
    </section>
  </section>;
}

export function DashboardExperience() {
  const { data: user } = useCurrentUser();
  if (!user) return <DashboardSkeleton />;
  if (user.role === "USER") return <UserDashboardContent />;
  if (user.role === "SUPPORT") return <SupportDashboardContent />;
  return <ModulePlaceholder title="Inicio" description="Esta vista se implementará en la siguiente etapa." />;
}
