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
import type { Subcategory } from "../api";
import { useCreateSubcategory, useUpdateSubcategory } from "../mutations/categories";
import { priorityLabels, priorityOptions, subcategoryFormValues, subcategorySchema, type SubcategoryFormValues, toCreateSubcategory, toSubcategoryPatch } from "../schemas/category";

export function SubcategoryEditorDialog({ open, onOpenChange, categoryId, subcategory }: { open: boolean; onOpenChange: (value: boolean) => void; categoryId: string; subcategory?: Subcategory }) {
  const create = useCreateSubcategory(categoryId); const update = useUpdateSubcategory(subcategory?.id ?? ""); const locked = useRef(false);
  const form = useForm<SubcategoryFormValues>({ resolver: zodResolver(subcategorySchema), defaultValues: subcategoryFormValues(subcategory) });
  const mutation = subcategory ? update : create; const pending = mutation.isPending || form.formState.isSubmitting;
  async function submit(values: SubcategoryFormValues) {
    if (locked.current) return; locked.current = true; form.clearErrors();
    try {
      if (subcategory) {
        const body = toSubcategoryPatch(values, form.formState.dirtyFields);
        if (!Object.keys(body).length) { onOpenChange(false); return; }
        await update.mutateAsync(body);
      } else await create.mutateAsync(toCreateSubcategory(values));
      onOpenChange(false);
    } catch (error) {
      for (const field of ["code", "name", "priority", "isActive"] as const) {
        const message = apiFieldMessage(error, field);
        if (message) form.setError(field, { type: "server", message });
      }
    } finally { locked.current = false; }
  }
  const fields = form.formState.errors;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent open={open} onOpenChange={onOpenChange}><DialogHeader><DialogTitle>{subcategory ? "Editar subcategoría" : "Agregar subcategoría"}</DialogTitle><DialogDescription>Si no eliges una prioridad, se usará la predeterminada de la categoría.</DialogDescription></DialogHeader>
    <form aria-busy={pending} className="grid gap-4 px-6 pb-6" noValidate onSubmit={(e) => { void form.handleSubmit(submit)(e); }}>
      {!subcategory && <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="subcategory-code">Código</label><Input id="subcategory-code" readOnly={pending} {...form.register("code")} aria-invalid={!!fields.code} />{fields.code?.message && <p className="text-sm text-danger-foreground" role="alert">{fields.code.message}</p>}</div>}
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="subcategory-name">Nombre</label><Input id="subcategory-name" readOnly={pending} {...form.register("name")} aria-invalid={!!fields.name} />{fields.name?.message && <p className="text-sm text-danger-foreground" role="alert">{fields.name.message}</p>}</div>
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="subcategory-priority">Prioridad específica</label><Select disabled={pending} id="subcategory-priority" {...form.register("priority")}><option value="">Usar prioridad de la categoría</option>{priorityOptions.map((value) => <option key={value} value={value}>{priorityLabels[value]}</option>)}</Select></div>
      {subcategory && <label className="flex items-center gap-3 rounded-lg border p-3 text-sm"><Checkbox disabled={pending} {...form.register("isActive")} />Subcategoría activa</label>}
      {mutation.isError && <ErrorState title={mutation.error instanceof ApiError && mutation.error.status === 409 ? "El código ya está registrado en esta categoría" : "No se pudo guardar la subcategoría"} message={mutation.error.message} requestId={apiRequestId(mutation.error)} />}
      <DialogFooter className="-mx-6 -mb-6"><Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">Cancelar</Button><Button disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
