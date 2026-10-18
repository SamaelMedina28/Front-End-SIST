"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/api-error";
import { apiRequestId } from "@/lib/api/form-error";
import { useCategories } from "../queries/categories";
import { useDeactivateCategory, useDeactivateSubcategory } from "../mutations/categories";
import type { Category, Subcategory } from "../api";
import { priorityLabels, supportAreaLabels } from "../schemas/category";
import { CategoryEditorDialog } from "./category-editor-dialog";
import { SubcategoryEditorDialog } from "./subcategory-editor-dialog";

type Editor = { kind: "category"; category?: Category } | { kind: "subcategory"; category: Category; subcategory?: Subcategory };
type DeleteTarget = { kind: "category" | "subcategory"; id: string; label: string };

export function CategoriesAdmin() {
  const query = useCategories({ includeInactive: true });
  const removeCategory = useDeactivateCategory(); const removeSubcategory = useDeactivateSubcategory();
  const [editor, setEditor] = useState<Editor>(); const [target, setTarget] = useState<DeleteTarget>(); const [deleteError, setDeleteError] = useState<unknown>();
  async function confirmDelete() {
    if (!target) return;
    setDeleteError(undefined);
    try {
      if (target.kind === "category") await removeCategory.mutateAsync(target.id);
      else await removeSubcategory.mutateAsync(target.id);
      setTarget(undefined);
    } catch (error) { setDeleteError(error); }
  }
  const pending = removeCategory.isPending || removeSubcategory.isPending;
  return <section className="grid min-w-0 gap-6">
    <PageHeader title="Categorías" description="Administra las categorías y subcategorías disponibles al crear un ticket." actions={<Button onClick={() => setEditor({ kind: "category" })}><Plus aria-hidden="true" size={16} />Crear categoría</Button>} />
    {!!deleteError && <ErrorState title={deleteError instanceof ApiError && deleteError.status === 409 ? "No se pudo desactivar por un conflicto" : "No se pudo desactivar"} message={deleteError instanceof Error ? deleteError.message : "La operación no se completó."} requestId={apiRequestId(deleteError)} onRetry={() => { setDeleteError(undefined); void query.refetch(); }} />}
    {query.isPending ? <div aria-label="Cargando categorías" className="grid gap-4" role="status">{[1, 2, 3].map((n) => <div className="h-48 animate-pulse rounded-xl bg-muted" key={n} />)}</div> : query.isError ? <ErrorState title={query.error instanceof ApiError && query.error.status === 403 ? "Acceso restringido" : "No se pudieron cargar las categorías"} message={query.error instanceof Error ? query.error.message : "Error inesperado."} requestId={apiRequestId(query.error)} onRetry={() => { void query.refetch(); }} /> : !query.data?.length ? <EmptyState title="No hay categorías registradas." description="Crea la primera categoría para que aparezca al crear un ticket." action={<Button onClick={() => setEditor({ kind: "category" })} size="sm"><Plus aria-hidden="true" size={16} />Crear categoría</Button>} /> : <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      {query.data.map((category) => <Card className="min-w-0" key={category.id}><CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="grid min-w-0 gap-2"><CardTitle className="break-words">{category.name}</CardTitle><p className="font-mono text-xs text-muted-foreground">{category.code}</p><div className="flex flex-wrap gap-2"><Badge tone="info">{supportAreaLabels[category.supportArea]}</Badge><Badge tone={category.isActive ? "success" : "neutral"}>{category.isActive ? "Activa" : "Inactiva"}</Badge><Badge tone="neutral">Prioridad: {category.defaultPriority ? priorityLabels[category.defaultPriority] : "Sin predeterminada"}</Badge>{category.requiresSoftwareDetails && <Badge tone="warning">Requiere datos de software</Badge>}</div></div><div className="flex shrink-0 gap-2"><Button aria-label={`Editar categoría ${category.name}`} onClick={() => setEditor({ kind: "category", category })} size="sm" variant="outline"><Pencil aria-hidden="true" size={15} /><span className="sr-only sm:not-sr-only">Editar</span></Button>{category.isActive && <Button aria-label={`Desactivar categoría ${category.name}`} onClick={() => { setDeleteError(undefined); setTarget({ kind: "category", id: category.id, label: category.name }); }} size="sm" variant="danger"><Trash2 aria-hidden="true" size={15} /><span className="sr-only sm:not-sr-only">Desactivar</span></Button>}</div></CardHeader>
        <CardContent className="grid min-w-0 gap-3"><div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4"><h3 className="text-sm font-semibold">Subcategorías activas</h3><Button disabled={!category.isActive} onClick={() => setEditor({ kind: "subcategory", category })} size="sm" variant="secondary"><Plus aria-hidden="true" size={15} />Agregar subcategoría</Button></div>{!category.subcategories.length ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No hay subcategorías activas.</p> : <ul className="grid gap-2">{category.subcategories.map((subcategory) => <li className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3" key={subcategory.id}><div className="min-w-0"><p className="break-words text-sm font-medium">{subcategory.name}</p><p className="font-mono text-xs text-muted-foreground">{subcategory.code} · Prioridad: {subcategory.priority ? priorityLabels[subcategory.priority] : "Usa la de categoría"}</p></div><div className="flex shrink-0 gap-1"><Button aria-label={`Editar subcategoría ${subcategory.name}`} onClick={() => setEditor({ kind: "subcategory", category, subcategory })} size="sm" variant="ghost"><Pencil aria-hidden="true" size={15} /></Button><Button aria-label={`Desactivar subcategoría ${subcategory.name}`} onClick={() => { setDeleteError(undefined); setTarget({ kind: "subcategory", id: subcategory.id, label: subcategory.name }); }} size="sm" variant="ghost"><Trash2 aria-hidden="true" size={15} /></Button></div></li>)}</ul>}</CardContent>
      </Card>)}
    </div>}
    {editor?.kind === "category" && <CategoryEditorDialog category={editor.category} key={editor.category?.id ?? "new-category"} onOpenChange={(open) => { if (!open) setEditor(undefined); }} open />}
    {editor?.kind === "subcategory" && <SubcategoryEditorDialog categoryId={editor.category.id} key={`${editor.category.id}:${editor.subcategory?.id ?? "new-subcategory"}`} onOpenChange={(open) => { if (!open) setEditor(undefined); }} open subcategory={editor.subcategory} />}
    <ConfirmDialog confirmLabel={target?.kind === "category" ? "Desactivar categoría" : "Desactivar subcategoría"} description={target?.kind === "category" ? <>Se desactivará <strong>{target.label}</strong>. Se conserva su historial y sus subcategorías no se desactivan automáticamente.</> : <>Se desactivará <strong>{target?.label}</strong>. No se eliminarán tickets ni datos históricos.</>} onConfirm={() => { void confirmDelete(); }} onOpenChange={(open) => { if (!open) setTarget(undefined); }} open={!!target} pending={pending} title={target?.kind === "category" ? "¿Desactivar esta categoría?" : "¿Desactivar esta subcategoría?"} />
  </section>;
}
