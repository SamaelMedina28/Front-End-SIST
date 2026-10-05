"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getRouteAccess } from "@/components/layout/navigation";
import { LoadingState, PageSkeleton } from "@/components/shared/loading-state";
import { ApiError } from "@/lib/api/api-error";
import { useCurrentUser } from "../queries/current-user";
import { AuthError } from "./auth-error";
import type { Role } from "@/types/api";

export function SessionGate({ mode, children, allowedRoles }: { mode: "login" | "onboarding" | "success" | "protected"; children?: ReactNode; allowedRoles?: readonly Role[] }) {
  const query = useCurrentUser();
  const router = useRouter();
  // Always wait for this visit's /me, even if a previous visit cached a 401.
  const loading = !query.isFetchedAfterMount || query.isPending || (query.isFetching && !query.data);
  const unauthorized = query.error instanceof ApiError && query.error.status === 401;
  const systemError = query.isError && !unauthorized;
  const authenticated = !query.isError && !!query.data;
  const forbidden = mode === "protected" && !loading && authenticated && !!allowedRoles && !!query.data && !allowedRoles.includes(query.data.role);
  const target = loading || systemError ? null
    : authenticated ? (mode === "protected" ? null : "/dashboard")
      : (mode === "protected" || mode === "success" ? "/login" : null);
  const destination = forbidden ? "/forbidden" : target;

  useEffect(() => { if (destination) router.replace(destination); }, [router, destination]);

  if (loading || destination) return <div role="status" aria-label="Verificando sesión" className="min-w-0 p-4">{mode === "protected" ? <PageSkeleton /> : <LoadingState label="Verificando sesión" />}</div>;
  if (systemError) return <AuthError error={query.error} onRetry={() => { void query.refetch(); }} />;
  if (mode === "protected" && authenticated && query.data && !forbidden) return <AppShell user={query.data}>{children}</AppShell>;
  return children;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  return <SessionGate mode="protected">{children}</SessionGate>;
}

/** Resolves role policy from the shared route table, then composes with the existing session gate. */
export function RoleGuard({ children, allowedRoles }: { children: ReactNode; allowedRoles?: readonly Role[] }) {
  const pathname = usePathname();
  // Fail closed when a protected route has no declared RBAC policy.
  const routeRoles = allowedRoles ?? getRouteAccess(pathname)?.roles ?? [];
  return <SessionGate mode="protected" allowedRoles={routeRoles}>{children}</SessionGate>;
}
