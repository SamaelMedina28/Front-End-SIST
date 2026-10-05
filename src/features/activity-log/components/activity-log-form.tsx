"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import Link from "next/link";

import { ErrorState } from "@/components/shared/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { tijuanaInputToIso, isoToTijuanaInput } from "../utils/date-time";
import { useUpdateActivityLog } from "../mutations/activity-log";
import type { ActivityLogDetail, ActivityLogPatchRequest, ActivityLogStatus } from "../api";
import { activityLogStatusLabels } from "../utils/presentation";

const editSchema = z.object({
  activity: z.string().min(1, "Describe la actividad."),
  serviceStartedAt: z.string().min(1, "Indica cuándo inició el servicio.").refine((value) => !!tijuanaInputToIso(value), "Indica una fecha y hora válida de Tijuana."),
  serviceEndedAt: z.string().refine((value) => !value || !!tijuanaInputToIso(value), "Indica una fecha y hora válida de Tijuana."),
  timeSpentMinutes: z.number().finite(),
  status: z.enum(["IN_PROGRESS", "COMPLETED"]),
});

type EditValues = z.infer<typeof editSchema>;

function apiFieldMessage(error: ApiError, field: string) {
  if (typeof error.fields !== "object" || error.fields === null || !(field in error.fields)) return undefined;
  const value = (error.fields as Record<string, unknown>)[field];
  return typeof value === "string" ? value : undefined;
}

export function ActivityLogEditForm({ entry, onCancel, onSaved }: { entry: ActivityLogDetail; onCancel: () => void; onSaved: () => void }) {
  const mutation = useUpdateActivityLog(entry.id);
  const form = useForm<EditValues>({ resolver: zodResolver(editSchema), defaultValues: {
    activity: entry.activity,
    serviceStartedAt: isoToTijuanaInput(entry.serviceStartedAt),
    serviceEndedAt: isoToTijuanaInput(entry.serviceEndedAt),
    timeSpentMinutes: entry.timeSpentMinutes,
    status: entry.status,
  } });
  const onSubmit = form.handleSubmit(async (values) => {
    const dirty = form.formState.dirtyFields;
    const body: ActivityLogPatchRequest = {};
    if (dirty.activity) body.activity = values.activity;
    if (dirty.serviceStartedAt) {
      const date = tijuanaInputToIso(values.serviceStartedAt);
      if (date) body.serviceStartedAt = date;
    }
    if (dirty.serviceEndedAt) body.serviceEndedAt = values.serviceEndedAt ? tijuanaInputToIso(values.serviceEndedAt) ?? null : null;
    if (dirty.timeSpentMinutes) body.timeSpentMinutes = values.timeSpentMinutes;
    if (dirty.status) body.status = values.status;
    try { await mutation.mutateAsync(body); onSaved(); }
    catch (error) { if (error instanceof ApiError && error.status === 422) { for (const field of ["activity", "serviceStartedAt", "serviceEndedAt", "timeSpentMinutes", "status"] as const) { const message = apiFieldMessage(error, field); if (message) form.setError(field, { message }); } } }
  });
  const mutationError = mutation.error;
  const conflict = mutationError instanceof ApiError && mutationError.status === 409;
  return <form className="grid gap-5 rounded-xl border bg-surface p-5" onSubmit={onSubmit}>
    {conflict && <ErrorState title="El registro cambió mientras lo editabas" message={`${mutationError.message} Recarga el detalle para revisar la versión actual antes de intentar de nuevo.`} requestId={mutationError.requestId} onRetry={onCancel} />}
    {mutation.isError && !conflict && <p className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm" role="alert">{mutationError instanceof Error ? mutationError.message : "No se pudieron guardar los cambios."}{mutationError instanceof ApiError && mutationError.requestId ? <span className="mt-1 block text-xs text-muted-foreground">Referencia: {mutationError.requestId}</span> : null}</p>}
    <div className="grid gap-1.5"><label htmlFor="edit-activity">Actividad</label><Textarea aria-invalid={!!form.formState.errors.activity} aria-describedby={form.formState.errors.activity ? "edit-activity-error" : undefined} id="edit-activity" {...form.register("activity")} />{form.formState.errors.activity && <p className="text-sm text-danger" id="edit-activity-error">{form.formState.errors.activity.message}</p>}</div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-1.5"><label htmlFor="edit-start">Inicio (hora de Tijuana)</label><Input aria-invalid={!!form.formState.errors.serviceStartedAt} id="edit-start" type="datetime-local" {...form.register("serviceStartedAt")} />{form.formState.errors.serviceStartedAt && <p className="text-sm text-danger">{form.formState.errors.serviceStartedAt.message}</p>}</div><div className="grid gap-1.5"><label htmlFor="edit-end">Fin (opcional, hora de Tijuana)</label><Input aria-invalid={!!form.formState.errors.serviceEndedAt} id="edit-end" type="datetime-local" {...form.register("serviceEndedAt")} />{form.formState.errors.serviceEndedAt && <p className="text-sm text-danger">{form.formState.errors.serviceEndedAt.message}</p>}</div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-1.5"><label htmlFor="edit-duration">Tiempo invertido (minutos)</label><Input id="edit-duration" step="any" type="number" {...form.register("timeSpentMinutes", { valueAsNumber: true })} /></div><div className="grid gap-1.5"><label htmlFor="edit-status">Estado de la bitácora</label><Select id="edit-status" {...form.register("status")}>{Object.entries(activityLogStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div></div>
    <div className="rounded-lg border bg-muted p-3 text-sm"><p className="font-medium">Participantes (solo lectura)</p><p className="mt-1 text-muted-foreground">{entry.participants.map((person) => person.fullName).join(", ") || "Sin participantes"}. El contrato no ofrece un catálogo autorizado para modificar la lista en este paso.</p></div>
    <div className="flex flex-wrap justify-end gap-2"><Button disabled={mutation.isPending || !form.formState.isDirty} onClick={onCancel} type="button" variant="outline">Cancelar</Button><Button disabled={mutation.isPending || !form.formState.isDirty} type="submit" variant="primary">{mutation.isPending ? "Guardando…" : "Guardar cambios"}</Button></div>
  </form>;
}

export function ActivityLogCreateBlock({ ticketId }: { ticketId?: string }) {
  return <section aria-labelledby="activity-create-blocker" className="grid gap-5">
    <div className="rounded-xl border border-warning/50 bg-warning/10 p-5" role="note">
      <h2 className="font-semibold" id="activity-create-blocker">No es posible registrar una bitácora todavía</h2>
      <p className="mt-2 text-sm leading-6">El backend exige <code>participantIds</code> para crear el registro, pero no ofrece un catálogo autorizado de participantes para SUB_MANAGER. Por seguridad, esta pantalla no solicita identidades por una vía no autorizada ni envía una lista vacía.</p>
      {ticketId && <p className="mt-2 text-sm text-muted-foreground">Ticket seleccionado: <span className="font-mono">{ticketId}</span></p>}
      <p className="mt-2 text-sm">La función podrá habilitarse cuando el backend publique un catálogo de participantes específico y autorizado.</p>
    </div>
    <div className="flex flex-wrap gap-3">
      {ticketId && <Link className={buttonVariants({ variant: "outline" })} href={`/tickets/${ticketId}`}>Volver al ticket</Link>}
      <Link className={buttonVariants({ variant: "outline" })} href="/activity-log">Volver a bitácora</Link>
    </div>
  </section>;
}

export type { ActivityLogStatus };
