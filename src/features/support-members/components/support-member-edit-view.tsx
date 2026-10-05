"use client";

import { ErrorState } from "@/components/shared/error-state";
import { apiRequestId } from "@/lib/api/form-error";
import { ApiError } from "@/lib/api/api-error";
import { useSupportMember } from "../queries/support-members";
import { SupportMemberForm } from "./support-member-form";

export function SupportMemberEditView({ id }: { id: string }) {
  const query = useSupportMember(id);
  if (query.isPending) return <div aria-label="Cargando integrante" className="grid gap-4" role="status"><div className="h-20 animate-pulse rounded-xl bg-muted" /><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>;
  if (query.isError || !query.data) return <ErrorState title={query.error instanceof ApiError && query.error.status === 404 ? "No se encontró el integrante" : query.error instanceof ApiError && query.error.status === 403 ? "Acceso restringido" : "No se pudo cargar el integrante"} message={query.error instanceof Error ? query.error.message : "Error inesperado."} requestId={apiRequestId(query.error)} onRetry={() => { void query.refetch(); }} />;
  return <SupportMemberForm key={query.data.id} member={query.data} />;
}
