"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/shared/loading-state";
import { ApiError } from "@/lib/api/api-error";
import { useCurrentUser } from "../queries/current-user";
import { AuthError } from "./auth-error";

export function SessionGate({ mode, children }: { mode: "login" | "onboarding" | "success" | "protected"; children?: ReactNode }) {
  const query = useCurrentUser();
  const router = useRouter();
  // Always wait for this visit's /me, even if a previous visit cached a 401.
  const loading = !query.isFetchedAfterMount || query.isPending || (query.isFetching && !query.data);
  const unauthorized = query.error instanceof ApiError && query.error.status === 401;
  const systemError = query.isError && !unauthorized;
  const authenticated = !query.isError && !!query.data;
  const target = loading || systemError ? null
    : authenticated ? (mode === "protected" ? null : "/dashboard")
      : (mode === "protected" || mode === "success" ? "/login" : null);

  useEffect(() => { if (target) router.replace(target); }, [router, target]);

  if (loading || target) return <div role="status" aria-label="Verificando sesión" className="p-4"><PageSkeleton /></div>;
  if (systemError) return <AuthError error={query.error} onRetry={() => { void query.refetch(); }} />;
  if (mode === "protected" && authenticated && query.data) return <AppShell user={query.data}>{children}</AppShell>;
  return children;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  return <SessionGate mode="protected">{children}</SessionGate>;
}
