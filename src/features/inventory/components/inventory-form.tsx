"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { ApiError } from "@/lib/api/api-error";
import { apiFieldMessage, apiRequestId } from "@/lib/api/form-error";
import type { InventoryItem, PatchInventoryRequest } from "../api";
import { useCreateInventoryItem, usePatchInventoryItem } from "../mutations/inventory";
import { createInventoryRequest, dirtyInventoryPatch, emptyInventoryValues, inventoryFormSchema, inventoryValues, type InventoryFormValues } from "../schemas/inventory-form";
import { inventoryTypeLabels } from "../utils/presentation";

type Field = keyof InventoryFormValues;
const fields: { key: Field; label: string; types: InventoryItem["type"][]; required?: InventoryItem["type"][]; multiline?: boolean }[] = [
  { key: "model", label: "Modelo o nombre", types: ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"], required: ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"] },
  { key: "assetCode", label: "Código patrimonial", types: ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"], required: ["COMPUTER", "PROJECTOR"] },
  { key: "color", label: "Color", types: ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"], required: ["COMPUTER", "PROJECTOR"] },
  { key: "size", label: "Tamaño", types: ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"], required: ["COMPUTER", "PROJECTOR"] },
  { key: "building", label: "Edificio", types: ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"], required: ["COMPUTER"] },
  { key: "room", label: "Aula / espacio", types: ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"] },
  { key: "serialNumber", label: "Número de serie", types: ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"], required: ["COMPUTER"] },
  { key: "quantity", label: "Cantidad", types: ["CONTROL", "ADAPTER"] },
  { key: "notes", label: "Notas", types: ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"], multiline: true },
];

export function InventoryForm({ item }: { item?: InventoryItem }) {
  const router = useRouter();
  const create = useCreateInventoryItem(); const update = usePatchInventoryItem(item?.id ?? "");
  const form = useForm<InventoryFormValues>({ resolver: zodResolver(inventoryFormSchema), defaultValues: item ? inventoryValues(item) : emptyInventoryValues() });
  const selectedType = useWatch({ control: form.control, name: "type" });
  const mutation = item ? update : create;
  const pending = mutation.isPending || form.formState.isSubmitting;
  async function submit(values: InventoryFormValues) {
    form.clearErrors();
    try {
      if (item) {
        const body: PatchInventoryRequest = dirtyInventoryPatch(values, form.formState.dirtyFields);
        if (!Object.keys(body).length) { router.push(`/inventory/${item.id}`); return; }
        await update.mutateAsync(body); router.push(`/inventory/${item.id}`);
      } else {
        const created = await create.mutateAsync(createInventoryRequest(values)); router.push(`/inventory/${created.id}`);
      }
    } catch (error) {
      for (const field of fields.map((f) => f.key)) {
        const message = apiFieldMessage(error, field);
        if (message) form.setError(field, { type: "server", message });
      }
    }
  }
  const formError = mutation.error;
  const errorTitle = formError instanceof ApiError && formError.status === 409 ? "El artículo entra en conflicto con un registro existente" : item ? "No se pudo actualizar el artículo" : "No se pudo crear el artículo";
  function changeType(type: InventoryFormValues["type"]) {
    form.reset(emptyInventoryValues(type));
    form.clearErrors();
  }
  return <section className="grid gap-6">
    <PageHeader title={item ? "Editar artículo" : "Agregar artículo"} description={item ? "Actualiza los datos permitidos por el servicio. El tipo de artículo es inmutable." : "Completa los datos de acuerdo con el tipo de artículo."} breadcrumb={<Link className="text-primary hover:underline" href={item ? `/inventory/${item.id}` : "/inventory"}>Inventario</Link>} />
    <form aria-busy={pending} className="grid gap-5" noValidate onSubmit={(e) => { void form.handleSubmit(submit)(e); }}>
      <Card><CardHeader><CardTitle>Datos del artículo</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1.5 md:col-span-2"><label className="text-sm font-medium" htmlFor="inventory-type">Tipo de artículo</label><Select disabled={!!item || pending} id="inventory-type" value={selectedType} onChange={(e) => changeType(e.target.value as InventoryFormValues["type"])}>{Object.entries(inventoryTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>{item && <p className="text-xs text-muted-foreground">El tipo no se puede cambiar después de crear el artículo.</p>}</div>
        {fields.filter((f) => f.types.includes(selectedType)).map((field) => {
          const required = field.key === "quantity" ? selectedType === "CONTROL" || selectedType === "ADAPTER" : field.required?.includes(selectedType) ?? false; const error = form.formState.errors[field.key];
          return <div className={`grid min-w-0 gap-1.5 ${field.multiline ? "md:col-span-2" : ""}`} key={field.key}><label className="text-sm font-medium" htmlFor={`inventory-${field.key}`}>{field.label} {required ? <span aria-hidden="true">*</span> : <span className="font-normal text-muted-foreground">(opcional)</span>}</label>{field.multiline ? <Textarea id={`inventory-${field.key}`} readOnly={pending} {...form.register(field.key)} aria-invalid={!!error} /> : <Input id={`inventory-${field.key}`} min={field.key === "quantity" ? 1 : undefined} type={field.key === "quantity" ? "number" : "text"} readOnly={pending} {...form.register(field.key)} aria-invalid={!!error} />}{error?.message && <p className="text-sm text-danger-foreground" role="alert">{error.message}</p>}</div>;
        })}
        {(selectedType === "COMPUTER" || selectedType === "PROJECTOR") && <p className="text-xs text-muted-foreground md:col-span-2">Las computadoras y proyectores se registran de forma individual (cantidad 1).</p>}
      </CardContent></Card>
      {formError && <ErrorState title={errorTitle} message={formError.message} requestId={apiRequestId(formError)} />}
      <div className="flex justify-end gap-3"><Link className="inline-flex h-11 items-center rounded-lg border bg-surface px-4 text-sm font-medium" href={item ? `/inventory/${item.id}` : "/inventory"}>Cancelar</Link><Button disabled={pending} type="submit">{pending ? "Guardando…" : item ? "Guardar cambios" : "Crear artículo"}</Button></div>
    </form>
  </section>;
}
