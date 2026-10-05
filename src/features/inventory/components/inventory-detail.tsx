"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDeactivateInventoryItem } from "../mutations/inventory";
import { useInventoryHistory, useInventoryItem } from "../queries/inventory";
import type { InventoryHistoryFilters } from "../api";
import { formatInventoryDate, inventoryLocation, inventoryTypeLabels } from "../utils/presentation";
import { apiRequestId } from "@/lib/api/form-error";
import { ApiError } from "@/lib/api/api-error";

const statusLabels = { OPEN: "Abierto", IN_REVIEW: "En revisión", IN_PROGRESS: "En progreso", COMPLETED: "Completado", CANCELLED: "Cancelado" } as const;

export function InventoryDetail({ id }: { id: string }) {
  const itemQuery = useInventoryItem(id); const [historyFilters, setHistoryFilters] = useState<InventoryHistoryFilters>({ page: 1, pageSize: 10 });
  const history = useInventoryHistory(id, historyFilters); const deactivate = useDeactivateInventoryItem(id); const [confirmOpen, setConfirmOpen] = useState(false);
  if (itemQuery.isPending) return <div aria-label="Cargando artículo" className="h-72 animate-pulse rounded-xl bg-muted" role="status" />;
  if (itemQuery.isError || !itemQuery.data) return <ErrorState title={itemQuery.error instanceof ApiError && itemQuery.error.status === 404 ? "No se encontró el artículo" : "No se pudo cargar el artículo"} message={itemQuery.error instanceof Error ? itemQuery.error.message : "El servidor no devolvió el artículo."} requestId={apiRequestId(itemQuery.error)} onRetry={() => { void itemQuery.refetch(); }} action={itemQuery.error instanceof ApiError && itemQuery.error.status === 404 ? <Link className="inline-flex h-9 items-center rounded-md border bg-surface px-3 text-xs font-medium" href="/inventory">Volver al inventario</Link> : undefined} />;
  const item = itemQuery.data;
  const deactivateError = deactivate.error;
  const fields = [["Tipo", inventoryTypeLabels[item.type]], ["Modelo", item.model], ["Código patrimonial", item.assetCode], ["Color", item.color], ["Tamaño", item.size], ["Edificio", item.building], ["Aula / espacio", item.room], ["Número de serie", item.serialNumber], ["Cantidad", String(item.quantity)], ["Notas", item.notes], ["Creado", formatInventoryDate(item.createdAt)], ["Última actualización", formatInventoryDate(item.updatedAt)]] as const;
  return <section className="grid min-w-0 gap-6">
    <PageHeader title={item.model || inventoryTypeLabels[item.type]} description={`${inventoryTypeLabels[item.type]} · ${inventoryLocation(item)}`} breadcrumb={<Link className="text-primary hover:underline" href="/inventory">Inventario</Link>} actions={<><Link className="inline-flex h-11 items-center gap-2 rounded-lg border bg-surface px-4 text-sm font-medium" href={`/inventory/${id}/edit`}><Pencil aria-hidden="true" size={16} />Editar</Link>{item.isActive && <Button variant="danger" onClick={() => setConfirmOpen(true)}><Trash2 aria-hidden="true" size={16} />Desactivar</Button>}</>} />
    {!item.isActive && <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm" role="status"><strong>Elemento inactivo.</strong> Se conserva su registro, sus identificadores únicos y el historial de tickets.</div>}
    <Card><CardHeader><CardTitle>Información del artículo</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fields.filter(([, value]) => value !== null && value !== "").map(([label, value]) => <div className="min-w-0" key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="break-words text-sm font-medium">{value}</p></div>)}</CardContent></Card>
    {deactivateError && <ErrorState title={deactivateError instanceof ApiError && deactivateError.status === 409 ? "No se pudo desactivar por un conflicto" : "No se pudo desactivar el artículo"} message={deactivateError.message} requestId={apiRequestId(deactivateError)} />}
    <Card><CardHeader><CardTitle>Historial de tickets</CardTitle><p className="text-sm text-muted-foreground">Se conserva el nombre del solicitante tal como estaba registrado en cada ticket.</p></CardHeader><CardContent className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3"><Select aria-label="Filtrar historial por estado" value={historyFilters.status ?? ""} onChange={(e) => setHistoryFilters((old) => ({ ...old, status: (e.target.value || undefined) as InventoryHistoryFilters["status"], page: 1 }))}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select><Input aria-label="Historial desde" type="date" value={historyFilters.from ?? ""} onChange={(e) => setHistoryFilters((old) => ({ ...old, from: e.target.value || undefined, page: 1 }))} /><Input aria-label="Historial hasta" type="date" value={historyFilters.to ?? ""} onChange={(e) => setHistoryFilters((old) => ({ ...old, to: e.target.value || undefined, page: 1 }))} /></div>
      {history.isPending ? <div aria-label="Cargando historial" className="h-40 animate-pulse rounded-xl bg-muted" role="status" /> : history.isError || !history.data ? <ErrorState title="No se pudo cargar el historial" message={history.error instanceof Error ? history.error.message : "El servidor no devolvió el historial."} requestId={apiRequestId(history.error)} onRetry={() => { void history.refetch(); }} /> : history.data.items.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No hay tickets para los filtros seleccionados.</p> : <div className="grid gap-3">{history.data.items.map((ticket) => <article className="rounded-lg border p-4" key={ticket.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><Link className="font-semibold text-primary hover:underline" href={`/tickets/${ticket.id}`}>{ticket.code} · {ticket.title}</Link><p className="mt-1 text-sm text-muted-foreground">{ticket.category.name}{ticket.subcategory ? ` / ${ticket.subcategory.name}` : ""} · Solicitante: {ticket.reporter.fullName}</p></div><StatusBadge status={ticket.status} /></div><p className="mt-2 text-xs text-muted-foreground">Creado {formatInventoryDate(ticket.createdAt)} · Prioridad: {ticket.priority === "HIGH" ? "Alta" : ticket.priority === "MEDIUM" ? "Media" : "Baja"}{ticket.completedAt ? ` · Completado ${formatInventoryDate(ticket.completedAt)}` : ""}</p></article>)}</div>}
      {history.data && history.data.meta.totalPages > 1 && <nav aria-label="Paginación del historial" className="flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">Página {history.data.meta.page} de {history.data.meta.totalPages}</span><span className="flex gap-2"><Button disabled={historyFilters.page === 1} size="sm" variant="outline" onClick={() => setHistoryFilters((old) => ({ ...old, page: Math.max(1, (old.page ?? 1) - 1) }))}>Anterior</Button><Button disabled={(historyFilters.page ?? 1) >= history.data.meta.totalPages} size="sm" variant="outline" onClick={() => setHistoryFilters((old) => ({ ...old, page: (old.page ?? 1) + 1 }))}>Siguiente</Button></span></nav>}
    </CardContent></Card>
    <ConfirmDialog confirmLabel="Desactivar artículo" description="Se conserva el artículo, sus identificadores únicos y los tickets asociados. Esta acción no elimina el historial." onConfirm={() => { void deactivate.mutateAsync().then(() => setConfirmOpen(false)).catch(() => undefined); }} onOpenChange={setConfirmOpen} open={confirmOpen} pending={deactivate.isPending} title="¿Desactivar este artículo?" />
  </section>;
}
