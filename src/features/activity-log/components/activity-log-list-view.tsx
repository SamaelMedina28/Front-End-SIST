"use client";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { useCurrentUser } from "@/features/auth/queries/current-user";
import type { ActivityLogFilters } from "../api";
import { ActivityLogList } from "./activity-log-list";

export function ActivityLogListView({ filters }: { filters: ActivityLogFilters }) {
  const { data: user } = useCurrentUser();
  if (!user) return <div aria-label="Cargando bitácora" className="h-72 animate-pulse rounded-xl bg-muted" role="status" />;
  if (user.role !== "SUPPORT" && user.role !== "SUB_MANAGER" && user.role !== "ADMIN") return <ModulePlaceholder title="Bitácora" description="No tienes acceso a esta función." />;
  return <ActivityLogList filters={filters} role={user.role} />;
}
