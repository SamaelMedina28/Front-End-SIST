"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useInventory } from "../queries/inventory";
import type { InventoryFilters } from "../api";
import { formatInventoryDate, inventoryTypeLabels } from "../utils/presentation";
import { apiRequestId } from "@/lib/api/form-error";

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }) {
  return <nav aria-label="Paginación del inventario" className="flex items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">Página {page} de {Math.max(1, pages)}</p><div className="flex gap-2"><Button disabled={page <= 1} onClick={() => onPage(page - 1)} size="sm" variant="outline">Anterior</Button><Button disabled={page >= pages} onClick={() => onPage(page + 1)} size="sm" variant="outline">Siguiente</Button></div></nav>;
}

export function InventoryList({ filters: initialFilters }: { filters: InventoryFilters }) {
  const result = useInventory(initialFilters);
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [building, setBuilding] = useState(initialFilters.building ?? "");
  function update(values: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, String(value));
    }
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }
  return <section className="grid min-w-0 gap-6">
    <PageHeader title="Inventario" description="Consulta y administra los artículos de soporte técnico." actions={<Link className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90" href="/inventory/new"><Plus aria-hidden="true" size={16} />Agregar artículo</Link>} />
    <Card><CardContent className="grid gap-4 pt-6 md:grid-cols-4">
      <div className="relative md:col-span-2"><Search aria-hidden="true" className="absolute left-3 top-3 text-muted-foreground" size={16} /><Input aria-label="Buscar inventario" className="pl-9" placeholder="Modelo, código, serie o ubicación" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update({ search: search.trim(), page: 1 }); }} /></div>
      <Select aria-label="Filtrar por tipo" value={initialFilters.type ?? ""} onChange={(e) => update({ type: e.target.value, page: 1 })}><option value="">Todos los tipos</option>{Object.entries(inventoryTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <Input aria-label="Filtrar por edificio" placeholder="Edificio" value={building} onChange={(e) => setBuilding(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") update({ building: building.trim(), page: 1 }); }} />
      <Select aria-label="Estado del inventario" value={initialFilters.active ?? "true"} onChange={(e) => update({ active: e.target.value, page: 1 })}><option value="true">Activos</option><option value="false">Inactivos</option></Select>
      <Select aria-label="Tamaño de página" className="md:col-start-4" value={String(initialFilters.pageSize ?? 20)} onChange={(e) => update({ pageSize: e.target.value, page: 1 })}><option value="10">10 por página</option><option value="20">20 por página</option><option value="50">50 por página</option></Select>
      <div className="flex gap-2 md:col-span-4"><Button size="sm" onClick={() => update({ search: search.trim(), building: building.trim(), page: 1 })}>Buscar</Button><Button size="sm" variant="outline" onClick={() => { setSearch(""); setBuilding(""); router.replace(pathname); }}>Limpiar filtros</Button></div>
    </CardContent></Card>
    {result.isPending ? <div aria-label="Cargando inventario" className="h-64 animate-pulse rounded-xl bg-muted" role="status" /> : result.isError || !result.data ? <ErrorState message={result.error instanceof Error ? result.error.message : "No se pudo cargar el inventario."} requestId={apiRequestId(result.error)} onRetry={() => { void result.refetch(); }} /> : result.data.items.length === 0 ? <EmptyState title="No hay artículos para mostrar" description="Prueba otros filtros o agrega un artículo al inventario." action={<Link className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground" href="/inventory/new">Agregar artículo</Link>} /> : <>
      <p className="text-sm text-muted-foreground" aria-live="polite">{result.data.meta.total} artículo{result.data.meta.total === 1 ? "" : "s"}</p>
      <div className="hidden overflow-x-auto rounded-xl border bg-surface md:block"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40 text-muted-foreground"><tr>{["Artículo", "Tipo", "Código patrimonial", "Ubicación", "Cantidad", "Estado", "Actualizado"].map((x) => <th className="px-4 py-3 font-medium" key={x}>{x}</th>)}</tr></thead><tbody>{result.data.items.map((item) => <tr className="border-b last:border-0 hover:bg-muted/30" key={item.id}><td className="px-4 py-3 font-medium"><Link className="text-primary hover:underline" href={`/inventory/${item.id}`}>{item.model || inventoryTypeLabels[item.type]}</Link></td><td className="px-4 py-3">{inventoryTypeLabels[item.type]}</td><td className="px-4 py-3">{item.assetCode || "—"}</td><td className="px-4 py-3">{[item.location.building, item.location.room].filter(Boolean).join(" · ") || "—"}</td><td className="px-4 py-3">{item.quantity}</td><td className="px-4 py-3"><span className={item.isActive ? "text-success-foreground" : "text-muted-foreground"}>{item.isActive ? "Activo" : "Inactivo"}</span></td><td className="px-4 py-3">{formatInventoryDate(item.updatedAt)}</td></tr>)}</tbody></table></div>
      <div className="grid gap-3 md:hidden">{result.data.items.map((item) => <Card key={item.id}><CardContent className="grid gap-2 pt-5"><div className="flex items-start justify-between gap-3"><Link className="font-semibold text-primary" href={`/inventory/${item.id}`}>{item.model || inventoryTypeLabels[item.type]}</Link><span className="text-xs text-muted-foreground">{item.isActive ? "Activo" : "Inactivo"}</span></div><p className="text-sm text-muted-foreground">{inventoryTypeLabels[item.type]} · {item.assetCode || "Sin código"}</p><p className="text-sm">{[item.location.building, item.location.room].filter(Boolean).join(" · ") || "Sin ubicación"} · Cantidad: {item.quantity}</p><p className="text-xs text-muted-foreground">Actualizado {formatInventoryDate(item.updatedAt)}</p></CardContent></Card>)}</div>
      <Pager page={result.data.meta.page} pages={result.data.meta.totalPages} onPage={(n) => update({ page: n })} />
    </>}
  </section>;
}
