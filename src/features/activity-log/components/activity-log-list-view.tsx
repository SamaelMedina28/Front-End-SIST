"use client";

import { useCurrentUser } from "@/features/auth/queries/current-user";
import type { ActivityLogFilters } from "../api";
import { ActivityLogList } from "./activity-log-list";

export function ActivityLogListView({ filters }: { filters: ActivityLogFilters }) {
  const { data: user } = useCurrentUser();
  if (!user) return <div aria-label="Cargando bitácora" className="h-72 animate-pulse rounded-xl bg-muted" role="status" />;
  if (user.role === "USER") return <p className="rounded-lg border p-4 text-sm" role="status">No tienes acceso a la bitácora.</p>;
  return <ActivityLogList filters={filters} role={user.role} />;
}
