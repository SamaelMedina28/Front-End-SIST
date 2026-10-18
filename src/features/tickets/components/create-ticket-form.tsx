"use client";

import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import type { CurrentUser } from "@/features/auth/api";
import { useCurrentUser } from "@/features/auth/queries/current-user";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFieldMessage, apiRequestId } from "@/lib/api/form-error";
import { ApiError } from "@/lib/api/api-error";
import { countWords } from "../utils/description-words";
import { createTicketRequest, createTicketSchema, type CreateTicketFormValues } from "../schemas/create-ticket";
import { useTicketFormCatalog } from "../queries/ticket-form";
import { useCreateTicket } from "../mutations/tickets";

function CatalogSkeleton() {
  return <div aria-label="Cargando formulario" className="grid gap-4" role="status"><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>;
}

export function CreateTicketForm({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const catalog = useTicketFormCatalog();
  const mutation = useCreateTicket();
  const locked = useRef(false);
  const { control, register, handleSubmit, setValue, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "", categoryId: "", subcategoryId: "", building: "", room: "", description: "", contactPhone: user.phone ?? "",
      softwareName: "", softwareVersion: "", softwareDownloadUrl: "", coordinationApprovalReference: "",
    },
  });
  const categoryId = useWatch({ control, name: "categoryId" });
  const description = useWatch({ control, name: "description" });
  const selectedCategory = catalog.data?.categories.find((category) => category.id === categoryId);
  const pending = mutation.isPending || isSubmitting;

  if (catalog.isPending) return <CatalogSkeleton />;
  if (catalog.isError || !catalog.data) return <ErrorState title="No se pudo cargar el formulario" message={catalog.error instanceof Error ? catalog.error.message : "No se pudieron obtener los datos del formulario."} requestId={apiRequestId(catalog.error)} onRetry={() => { void catalog.refetch(); }} />;

  async function submit(values: CreateTicketFormValues) {
    if (locked.current) return;
    locked.current = true;
    clearErrors();
    const category = catalog.data?.categories.find((item) => item.id === values.categoryId);
    if (!category) {
      setError("categoryId", { type: "validate", message: "Selecciona una categoría disponible." }, { shouldFocus: true });
      locked.current = false;
      return;
    }
    if (category.subcategories.length > 0 && !values.subcategoryId) {
      setError("subcategoryId", { type: "validate", message: "Selecciona una subcategoría." }, { shouldFocus: true });
      locked.current = false;
      return;
    }
    if (category.requiresSoftwareDetails) {
      const requiredFields = [
        ["softwareName", values.softwareName, "Ingresa el nombre del software."],
        ["softwareVersion", values.softwareVersion, "Ingresa la versión solicitada."],
        ["softwareDownloadUrl", values.softwareDownloadUrl, "Ingresa el enlace del software."],
        ["coordinationApprovalReference", values.coordinationApprovalReference, "Ingresa la referencia de autorización."],
      ] as const;
      const missing = requiredFields.find(([, value]) => !value.trim());
      if (missing) {
        setError(missing[0], { type: "validate", message: missing[2] }, { shouldFocus: true });
        locked.current = false;
        return;
      }
      try { new URL(values.softwareDownloadUrl); }
      catch {
        setError("softwareDownloadUrl", { type: "validate", message: "Ingresa una URL válida." }, { shouldFocus: true });
        locked.current = false;
        return;
      }
    }
    try {
      const created = await mutation.mutateAsync(createTicketRequest(values, category));
      router.push(`/tickets/${created.id}`);
    } catch (error) {
      const fieldNames = ["title", "categoryId", "subcategoryId", "building", "room", "description", "contactPhone", "softwareName", "softwareVersion", "softwareDownloadUrl", "coordinationApprovalReference"] as const;
      let focus = true;
      for (const field of fieldNames) {
        const message = apiFieldMessage(error, field);
        if (message) {
          setError(field, { type: "server", message }, { shouldFocus: focus });
          focus = false;
        }
      }
      locked.current = false;
    }
  }

  const count = countWords(description);
  const field = (name: keyof CreateTicketFormValues) => errors[name];
  const fieldError = (name: keyof CreateTicketFormValues) => {
    const error = field(name);
    return error?.message ? <p className="text-sm text-danger-foreground" id={`${name}-error`} role="alert">{error.message}</p> : null;
  };

  return <section className="grid min-w-0 gap-6">
    <PageHeader title="Nuevo ticket" description="Describe el problema para que el equipo pueda orientarte." />
    {catalog.data.maxActiveTickets > 0 && <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">Puedes tener hasta {catalog.data.maxActiveTickets} tickets activos al mismo tiempo.</p>}
    <form aria-busy={pending} className="grid min-w-0 gap-5" noValidate onSubmit={(event) => { void handleSubmit(submit)(event); }}>
      <Card><CardHeader><CardTitle>Información de la solicitud</CardTitle></CardHeader><CardContent className="grid min-w-0 gap-5">
        <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="ticket-title">Título <span aria-hidden="true">*</span></label><Input id="ticket-title" readOnly={pending} {...register("title")} aria-invalid={!!field("title")} aria-describedby={field("title") ? "title-error" : undefined} />{fieldError("title")}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid min-w-0 gap-1.5"><label className="text-sm font-medium" htmlFor="ticket-category">Categoría <span aria-hidden="true">*</span></label><Select disabled={pending} id="ticket-category" {...register("categoryId", { onChange: () => { setValue("subcategoryId", ""); setValue("softwareName", ""); setValue("softwareVersion", ""); setValue("softwareDownloadUrl", ""); setValue("coordinationApprovalReference", ""); clearErrors(); } })} aria-invalid={!!field("categoryId")} aria-describedby={field("categoryId") ? "categoryId-error" : undefined}><option value="">Selecciona una categoría</option>{catalog.data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select>{fieldError("categoryId")}</div>
          <div className="grid min-w-0 gap-1.5"><label className="text-sm font-medium" htmlFor="ticket-subcategory">Subcategoría{(selectedCategory?.subcategories.length ?? 0) > 0 && <span aria-hidden="true"> *</span>}</label><Select disabled={pending || !selectedCategory || selectedCategory.subcategories.length === 0} id="ticket-subcategory" {...register("subcategoryId")} aria-invalid={!!field("subcategoryId")} aria-describedby={field("subcategoryId") ? "subcategoryId-error" : undefined}><option value="">{selectedCategory?.subcategories.length ? "Selecciona una subcategoría" : "No aplica"}</option>{selectedCategory?.subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</Select>{fieldError("subcategoryId")}</div>
        </div>
        {selectedCategory?.requiresSoftwareDetails && <fieldset className="grid min-w-0 gap-4 rounded-xl border p-4 md:grid-cols-2"><legend className="px-1 text-sm font-semibold">Información del software</legend>
          <div className="grid min-w-0 gap-1.5"><label className="text-sm font-medium" htmlFor="software-name">Nombre del software <span aria-hidden="true">*</span></label><Input id="software-name" readOnly={pending} {...register("softwareName")} aria-invalid={!!field("softwareName")} aria-describedby={field("softwareName") ? "softwareName-error" : undefined} />{fieldError("softwareName")}</div>
          <div className="grid min-w-0 gap-1.5"><label className="text-sm font-medium" htmlFor="software-version">Versión <span aria-hidden="true">*</span></label><Input id="software-version" readOnly={pending} {...register("softwareVersion")} aria-invalid={!!field("softwareVersion")} aria-describedby={field("softwareVersion") ? "softwareVersion-error" : undefined} />{fieldError("softwareVersion")}</div>
          <div className="grid min-w-0 gap-1.5"><label className="text-sm font-medium" htmlFor="software-download-url">URL de descarga <span aria-hidden="true">*</span></label><Input id="software-download-url" type="url" readOnly={pending} {...register("softwareDownloadUrl")} aria-invalid={!!field("softwareDownloadUrl")} aria-describedby={field("softwareDownloadUrl") ? "softwareDownloadUrl-error" : undefined} />{fieldError("softwareDownloadUrl")}</div>
          <div className="grid min-w-0 gap-1.5"><label className="text-sm font-medium" htmlFor="software-approval">Referencia de autorización de coordinación <span aria-hidden="true">*</span></label><Input id="software-approval" readOnly={pending} {...register("coordinationApprovalReference")} aria-invalid={!!field("coordinationApprovalReference")} aria-describedby={field("coordinationApprovalReference") ? "coordinationApprovalReference-error" : undefined} />{fieldError("coordinationApprovalReference")}</div>
        </fieldset>}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid min-w-0 gap-1.5"><label className="text-sm font-medium" htmlFor="ticket-building">Edificio <span aria-hidden="true">*</span></label><Input id="ticket-building" readOnly={pending} {...register("building")} aria-invalid={!!field("building")} aria-describedby={field("building") ? "building-error" : undefined} />{fieldError("building")}</div>
          <div className="grid min-w-0 gap-1.5"><label className="text-sm font-medium" htmlFor="ticket-room">Aula / espacio <span className="font-normal text-muted-foreground">(opcional)</span></label><Input id="ticket-room" readOnly={pending} {...register("room")} aria-invalid={!!field("room")} aria-describedby={field("room") ? "room-error" : undefined} />{fieldError("room")}</div>
        </div>
        <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="ticket-description">Descripción <span aria-hidden="true">*</span></label><Textarea id="ticket-description" readOnly={pending} {...register("description")} aria-invalid={!!field("description")} aria-describedby={field("description") ? "description-error description-count" : "description-count"} /><div className="flex flex-wrap justify-between gap-2"><span className="text-xs text-muted-foreground" id="description-count">{count} / 50 palabras</span>{fieldError("description")}</div></div>
        <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="ticket-contact-phone">Teléfono de contacto <span className="font-normal text-muted-foreground">(opcional)</span></label><Input id="ticket-contact-phone" autoComplete="tel" readOnly={pending} {...register("contactPhone")} aria-invalid={!!field("contactPhone")} aria-describedby={field("contactPhone") ? "contactPhone-error" : undefined} />{fieldError("contactPhone")}</div>
        <p className="text-xs text-muted-foreground">El sistema determina prioridad y estado inicial a partir de sus reglas. No se envían opciones de estado, prioridad ni asignación.</p>
      </CardContent></Card>
      {mutation.isError && <ErrorState title={mutation.error instanceof ApiError && mutation.error.status === 409 ? "No se pudo crear el ticket por un conflicto" : "No se pudo crear el ticket"} message={mutation.error.message} requestId={apiRequestId(mutation.error)} />}
      <div className="flex flex-wrap justify-end gap-3"><Button disabled={pending} type="button" variant="outline" onClick={() => router.push("/tickets")}>Volver</Button><Button disabled={pending} type="submit">{pending ? "Creando…" : "Crear ticket"}</Button></div>
      <span className="sr-only" role="status">{pending ? "Creando ticket" : ""}</span>
    </form>
  </section>;
}

export function CreateTicketPageView() {
  const { data: user } = useCurrentUser();
  if (!user) return <CatalogSkeleton />;
  return <CreateTicketForm user={user} />;
}
