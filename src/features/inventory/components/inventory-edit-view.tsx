"use client";

import { ErrorState } from "@/components/shared/error-state";
import { apiRequestId } from "@/lib/api/form-error";
import { useInventoryItem } from "../queries/inventory";
import { InventoryForm } from "./inventory-form";

export function InventoryEditView({ id }: { id: string }) {
  const query = useInventoryItem(id);
  if (query.isPending) return <div aria-label="Cargando artículo" className="h-72 animate-pulse rounded-xl bg-muted" role="status" />;
  if (query.isError || !query.data) return <ErrorState title="No se pudo cargar el artículo" message={query.error instanceof Error ? query.error.message : "No se pudo obtener la información del artículo."} requestId={apiRequestId(query.error)} onRetry={() => { void query.refetch(); }} />;
  return <InventoryForm item={query.data} />;
}
