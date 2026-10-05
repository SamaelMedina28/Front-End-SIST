"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError } from "@/lib/api/api-error";
import { apiFieldMessage, apiRequestId } from "@/lib/api/form-error";
import type { Category } from "../api";
import { useCreateCategory, useUpdateCategory } from "../mutations/categories";
import { categoryFormValues, categorySchema, priorityLabels, supportAreaLabels, supportAreaOptions, type CategoryFormValues, priorityOptions, toCategoryPatch, toCreateCategory } from "../schemas/category";

export function CategoryEditorDialog({ open, onOpenChange, category }: { open: boolean; onOpenChange: (value: boolean) => void; category?: Category }) {
  const create = useCreateCategory(); const update = useUpdateCategory(category?.id ?? ""); const locked = useRef(false);
  const form = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema), defaultValues: categoryFormValues(category) });
  const mutation = category ? update : create; const pending = mutation.isPending || form.formState.isSubmitting;
  async function submit(values: CategoryFormValues) {
    if (locked.current) return; locked.current = true; form.clearErrors();
    try {
      if (category) {
        const body = toCategoryPatch(values, form.formState.dirtyFields);
        if (!Object.keys(body).length) { onOpenChange(false); return; }
        await update.mutateAsync(body);
      } else await create.mutateAsync(toCreateCategory(values));
      onOpenChange(false);
    } catch (error) {
      for (const field of ["code", "name", "supportArea", "defaultPriority", "requiresSoftwareDetails", "isActive"] as const) {
        const message = apiFieldMessage(error, field);
        if (message) form.setError(field, { type: "server", message });
      }
    } finally { locked.current = false; }
  }
  const fields = form.formState.errors;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] overflow-y-auto" open={open} onOpenChange={onOpenChange}><DialogHeader><DialogTitle>{category ? "Editar categoría" : "Crear categoría"}</DialogTitle><DialogDescription>Configura la información que se utiliza en el catálogo de solicitudes. La prioridad final la calcula el servidor.</DialogDescription></DialogHeader>
    <form aria-busy={pending} className="grid gap-4 px-6 pb-6" noValidate onSubmit={(e) => { void form.handleSubmit(submit)(e); }}>
      {!category && <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="category-code">Código técnico</label><Input id="category-code" readOnly={pending} {...form.register("code")} aria-invalid={!!fields.code} />{fields.code?.message && <p className="text-sm text-danger-foreground" role="alert">{fields.code.message}</p>}<p className="text-xs text-muted-foreground">Código estable en formato UPPER_SNAKE_CASE.</p></div>}
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="category-name">Nombre</label><Input id="category-name" readOnly={pending} {...form.register("name")} aria-invalid={!!fields.name} />{fields.name?.message && <p className="text-sm text-danger-foreground" role="alert">{fields.name.message}</p>}</div>
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="category-area">Área de soporte</label><Select disabled={pending} id="category-area" {...form.register("supportArea")}>{supportAreaOptions.map((value) => <option key={value} value={value}>{supportAreaLabels[value]}</option>)}</Select></div>
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="category-priority">Prioridad predeterminada</label><Select disabled={pending} id="category-priority" {...form.register("defaultPriority")}><option value="">Sin prioridad predeterminada</option>{priorityOptions.map((value) => <option key={value} value={value}>{priorityLabels[value]}</option>)}</Select></div>
      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><Checkbox disabled={pending} {...form.register("requiresSoftwareDetails")} /><span><span className="font-medium">Requiere información de software</span><span className="mt-1 block text-xs text-muted-foreground">El formulario de tickets solicitará esos datos cuando el catálogo lo indique.</span></span></label>
      {category && <label className="flex items-center gap-3 rounded-lg border p-3 text-sm"><Checkbox disabled={pending} {...form.register("isActive")} />Categoría activa</label>}
      {mutation.isError && <ErrorState title={mutation.error instanceof ApiError && mutation.error.status === 409 ? "El código ya está en uso" : "No se pudo guardar la categoría"} message={mutation.error.message} requestId={apiRequestId(mutation.error)} />}
      <DialogFooter className="-mx-6 -mb-6"><Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">Cancelar</Button><Button disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
