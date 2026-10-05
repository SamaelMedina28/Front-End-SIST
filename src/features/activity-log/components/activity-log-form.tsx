"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { tijuanaInputToIso, isoToTijuanaInput } from "../utils/date-time";
import { useCreateActivityLog, useUpdateActivityLog } from "../mutations/activity-log";
import type { ActivityLogCreateRequest, ActivityLogDetail, ActivityLogPatchRequest, ActivityLogStatus } from "../api";
import { useActivityLogParticipants } from "../queries/activity-log";
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
  const router = useRouter();
  const [selectedTicketId, setSelectedTicketId] = useState(ticketId ?? "");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const candidates = useActivityLogParticipants(selectedTicketId);
  const mutation = useCreateActivityLog();
  const validParticipantIds = participantIds.filter((id) => candidates.data?.some((candidate) => candidate.id === id));
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!candidates.data?.length || validParticipantIds.length === 0) return;
    const form = new FormData(event.currentTarget);
    const serviceStartedAt = tijuanaInputToIso(String(form.get("serviceStartedAt") ?? ""));
    const endedInput = String(form.get("serviceEndedAt") ?? "");
    const serviceEndedAt = endedInput ? tijuanaInputToIso(endedInput) : undefined;
    const timeSpentMinutes = Number(form.get("timeSpentMinutes"));
    const activity = String(form.get("activity") ?? "").trim();
    if (!serviceStartedAt || (endedInput && !serviceEndedAt) || !activity || !Number.isFinite(timeSpentMinutes)) return;
    const body: ActivityLogCreateRequest = { ticketId: selectedTicketId, activity, participantIds: validParticipantIds, serviceStartedAt,
      ...(serviceEndedAt ? { serviceEndedAt } : {}), timeSpentMinutes,
      status: String(form.get("status")) as ActivityLogCreateRequest["status"] };
    try { const created = await mutation.mutateAsync(body); router.push(`/activity-log/${created.id}`); }
    catch { /* El backend conserva la validación definitiva; el error se presenta abajo. */ }
  };
  const noCandidates = candidates.isSuccess && candidates.data.length === 0;
  return <section className="grid gap-5"><form className="grid gap-5 rounded-xl border bg-surface p-5" onSubmit={onSubmit}>
    <div className="grid gap-1.5"><label htmlFor="create-ticket-id">Ticket (UUID)</label><Input autoComplete="off" id="create-ticket-id" onChange={(event) => { setSelectedTicketId(event.target.value.trim()); setParticipantIds([]); }} placeholder="Selecciona o pega el id del ticket" value={selectedTicketId} /><p className="text-xs text-muted-foreground">Desde el detalle de un ticket, este campo llega preseleccionado.</p></div>
    <div aria-live="polite" className="rounded-lg border p-4">
      {!selectedTicketId && <p className="text-sm text-muted-foreground">Indica un ticket para consultar los participantes autorizados.</p>}
      {selectedTicketId && candidates.isFetching && <p role="status" className="text-sm">Cargando participantes…</p>}
      {selectedTicketId && candidates.isError && <div role="alert"><p className="text-sm text-danger">No se pudieron cargar los participantes. Verifica el ticket y vuelve a intentar.</p>{candidates.error instanceof ApiError && candidates.error.requestId && <p className="mt-1 text-xs text-muted-foreground">Referencia: {candidates.error.requestId}</p>}<Button className="mt-2" onClick={() => void candidates.refetch()} type="button" variant="outline">Reintentar</Button></div>}
      {noCandidates && <p className="text-sm text-muted-foreground">Este ticket no tiene participantes elegibles. No se puede registrar la bitácora sin seleccionar al menos uno.</p>}
      {candidates.data && candidates.data.length > 0 && <fieldset className="grid gap-2"><legend className="mb-2 font-medium">Participantes (selecciona uno o más)</legend>{candidates.data.map((person) => <label className="flex items-center gap-2 text-sm" key={person.id}><input checked={validParticipantIds.includes(person.id)} onChange={(event) => setParticipantIds((current) => event.target.checked ? [...current.filter((id) => candidates.data!.some((candidate) => candidate.id === id)), person.id] : current.filter((id) => id !== person.id))} type="checkbox" value={person.id} />{person.fullName}<span className="text-xs text-muted-foreground">({person.role})</span></label>)}</fieldset>}
    </div>
    <div className="grid gap-1.5"><label htmlFor="create-activity">Actividad</label><Textarea id="create-activity" name="activity" required /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-1.5"><label htmlFor="create-start">Inicio (hora de Tijuana)</label><Input id="create-start" name="serviceStartedAt" required type="datetime-local" /></div><div className="grid gap-1.5"><label htmlFor="create-end">Fin (opcional, hora de Tijuana)</label><Input id="create-end" name="serviceEndedAt" type="datetime-local" /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-1.5"><label htmlFor="create-duration">Tiempo invertido (minutos)</label><Input id="create-duration" min="0" name="timeSpentMinutes" required step="any" type="number" /></div><div className="grid gap-1.5"><label htmlFor="create-status">Estado</label><Select defaultValue="IN_PROGRESS" id="create-status" name="status"><option value="IN_PROGRESS">En proceso</option><option value="COMPLETED">Finalizado</option></Select></div></div>
    {mutation.isError && <p className="text-sm text-danger" role="alert">{mutation.error instanceof Error ? mutation.error.message : "No se pudo crear la bitácora."}{mutation.error instanceof ApiError && mutation.error.requestId && <span className="mt-1 block text-xs">Referencia: {mutation.error.requestId}</span>}</p>}
    <div className="flex flex-wrap justify-end gap-2"><Link className={buttonVariants({ variant: "outline" })} href={selectedTicketId ? `/tickets/${selectedTicketId}` : "/activity-log"}>Cancelar</Link><Button disabled={mutation.isPending || candidates.isFetching || !candidates.data?.length || validParticipantIds.length === 0} type="submit" variant="primary">{mutation.isPending ? "Guardando…" : "Registrar actividad"}</Button></div>
  </form></section>;
}

export type { ActivityLogStatus };
