"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupportMembers } from "@/features/support-members/queries/support-members";
import { ApiError } from "@/lib/api/api-error";
import { isTicketPriority, ticketPriorityLabels } from "@/lib/constants/presentation";
import type { CurrentUser } from "@/features/auth/api";
import type { TicketDetail, TicketPriority } from "../api";
import { useAdminAssignTicket, useAdminChangeTicketPriority, useAdminUnassignTicket } from "../mutations/admin-actions";
import { isSupportArea, supportAreaLabel } from "../utils/support-area";
import { cn } from "@/lib/utils";

function TicketMutationError({ error, onRefresh }: { error: Error | null; onRefresh: () => void }) {
  if (!error) return null;
  return <div className="grid gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3" role="alert">
    <p className="text-sm">{error.message}</p>
    {error instanceof ApiError && error.requestId && <p className="text-xs text-muted-foreground">Solicitud: {error.requestId}</p>}
    <Button className="w-fit" onClick={onRefresh} size="sm" variant="outline">Volver a consultar</Button>
  </div>;
}

export function AdminTicketManagement({ ticket, user, onRefresh }: { ticket: TicketDetail; user: CurrentUser; onRefresh: () => void }) {
  const isAdmin = user.role === "ADMIN";
  const area = isSupportArea(ticket.category.supportArea) ? ticket.category.supportArea : undefined;
  const terminal = ticket.status === "COMPLETED" || ticket.status === "CANCELLED";
  const canChangeAssignment = !terminal && ["OPEN", "IN_REVIEW", "IN_PROGRESS"].includes(ticket.status);
  const [search, setSearch] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [prioritySelection, setPrioritySelection] = useState<{ source: string; value: TicketPriority | "" }>({ source: ticket.priority, value: isTicketPriority(ticket.priority) ? ticket.priority : "" });
  const priority: TicketPriority | "" = isTicketPriority(ticket.priority)
    ? prioritySelection.source === ticket.priority ? prioritySelection.value : ticket.priority
    : "";
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const filters = useMemo(() => ({ page: 1, pageSize: 100, active: "true" as const, supportArea: area, search: search.trim() || undefined }), [area, search]);
  const supportMembers = useSupportMembers({ ...filters, role: "SUPPORT" }, isAdmin && !!area && canChangeAssignment);
  const subManagers = useSupportMembers({ ...filters, role: "SUB_MANAGER" }, isAdmin && !!area && canChangeAssignment);
  const candidates = [...(supportMembers.data?.members ?? []), ...(subManagers.data?.members ?? [])].filter((member) => member.isActive && area && member.supportAreas.includes(area));
  const assignment = useAdminAssignTicket(ticket.id);
  const unassignment = useAdminUnassignTicket(ticket.id);
  const priorityChange = useAdminChangeTicketPriority(ticket.id);
  const assignmentBusy = assignment.isPending || unassignment.isPending;
  const priorityBusy = priorityChange.isPending;
  const candidateError = supportMembers.error ?? subManagers.error;

  function assign() {
    if (!selectedAssignee || selectedAssignee === ticket.assignee?.id || assignment.isPending) return;
    assignment.mutate({ assigneeId: selectedAssignee }, { onSuccess: () => { setSelectedAssignee(""); setSearch(""); } });
  }

  function changePriority() {
    if (!priority || !reason.trim() || !isTicketPriority(ticket.priority) || priority === ticket.priority || priorityChange.isPending) return;
    priorityChange.mutate({ priority, reason: reason.trim() }, { onSuccess: () => setReason("") });
  }

  return <section aria-labelledby="admin-ticket-title" className="grid min-w-0 gap-5 rounded-xl border bg-surface p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold" id="admin-ticket-title">Administración del ticket</h2><p className="mt-1 text-sm text-muted-foreground">Cambia el técnico asignado y la prioridad. Cada cambio queda registrado en el historial.</p></div>
      <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/admin/support-members">Administrar personal</Link>
    </div>
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <div className="grid min-w-0 content-start gap-3 rounded-lg border p-4">
        <div><h3 className="font-medium">{ticket.assignee ? "Reasignar técnico" : "Asignar técnico"}</h3><p className="mt-1 text-sm text-muted-foreground">{ticket.assignee ? `Asignado actualmente a ${ticket.assignee.fullName ?? "personal de soporte"}.` : "Sin técnico asignado."}{area ? ` Área: ${supportAreaLabel(area)}.` : " No se identificó un área válida; la selección está desactivada."}</p></div>
        {terminal ? <p className="rounded-md bg-muted p-3 text-sm" role="status">Solo se pueden asignar o desasignar tickets activos.</p> : <>
          <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="admin-assignee-search">Buscar personal activo</label><Input autoComplete="off" disabled={!area || !canChangeAssignment || assignmentBusy} id="admin-assignee-search" onChange={(event) => { setSearch(event.target.value); setSelectedAssignee(""); }} placeholder="Buscar por nombre" value={search} /></div>
          <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="admin-assignee">Técnico</label><Select disabled={!area || !canChangeAssignment || assignmentBusy || (!!candidateError && candidates.length === 0)} id="admin-assignee" onChange={(event) => setSelectedAssignee(event.target.value)} value={selectedAssignee}><option value="">Selecciona una persona</option>{candidates.map((member) => <option disabled={member.id === ticket.assignee?.id} key={member.id} value={member.id}>{member.fullName} · {member.role === "SUPPORT" ? "Soporte" : "Subencargado"}{member.id === ticket.assignee?.id ? " · Actual" : ""} · {member.supportAreas.map(supportAreaLabel).join(", ")}{member.skills.length ? ` · ${member.skills.join(", ")}` : ""}</option>)}</Select></div>
          {area && !candidateError && candidates.length === 0 && <p className="text-sm text-muted-foreground" role="status">No hay personal activo disponible para esta área.</p>}
          {candidateError && <p className="text-sm text-destructive" role="alert">{candidateError instanceof Error ? candidateError.message : "No se pudieron consultar candidatos."}{candidateError instanceof ApiError && candidateError.requestId ? ` · Solicitud: ${candidateError.requestId}` : ""}</p>}
          <div className="flex flex-wrap gap-2"><Button disabled={!selectedAssignee || selectedAssignee === ticket.assignee?.id || assignmentBusy} onClick={assign}>{assignment.isPending ? "Asignando…" : ticket.assignee ? "Reasignar" : "Asignar"}</Button>{ticket.assignee && <Button disabled={assignmentBusy} onClick={() => setDialogOpen(true)} variant="outline">{unassignment.isPending ? "Desasignando…" : "Desasignar"}</Button>}</div>
        </>}
        {assignment.isSuccess && <p aria-live="polite" className="text-sm text-success" role="status">Técnico asignado correctamente.</p>}
        {unassignment.isSuccess && <p aria-live="polite" className="text-sm text-success" role="status">Ticket desasignado correctamente.</p>}
        <TicketMutationError error={assignment.error ?? unassignment.error} onRefresh={onRefresh} />
      </div>
      <div className="grid min-w-0 content-start gap-3 rounded-lg border p-4">
        <div><h3 className="font-medium">Modificar prioridad</h3><p className="mt-1 text-sm text-muted-foreground">Prioridad actual: {isTicketPriority(ticket.priority) ? ticketPriorityLabels[ticket.priority] : `No reconocida (${ticket.priority})`}.</p></div>
        {terminal ? <p className="rounded-md bg-muted p-3 text-sm" role="status">La prioridad de un ticket finalizado no se puede modificar.</p> : <>
          <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="admin-ticket-priority">Nueva prioridad</label><Select disabled={!isTicketPriority(ticket.priority) || priorityBusy} id="admin-ticket-priority" onChange={(event) => setPrioritySelection({ source: ticket.priority, value: event.target.value as TicketPriority | "" })} value={priority}><option value="">Selecciona una prioridad</option>{Object.entries(ticketPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
          <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="admin-priority-reason">Motivo del cambio</label><Textarea disabled={priorityBusy} id="admin-priority-reason" onChange={(event) => setReason(event.target.value)} placeholder="Describe brevemente la razón" value={reason} /></div>
          <Button className="w-fit" disabled={!priority || !reason.trim() || !isTicketPriority(ticket.priority) || priority === ticket.priority || priorityBusy} onClick={changePriority}>{priorityChange.isPending ? "Actualizando…" : "Actualizar prioridad"}</Button>
        </>}
        {priorityChange.isSuccess && <p aria-live="polite" className="text-sm text-success" role="status">Prioridad actualizada correctamente.</p>}
        <TicketMutationError error={priorityChange.error} onRefresh={onRefresh} />
      </div>
    </div>
    <ConfirmDialog confirmLabel="Desasignar técnico" description="El ticket quedará sin técnico asignado." onConfirm={() => unassignment.mutate()} onOpenChange={(open) => { if (!assignmentBusy) setDialogOpen(open); }} open={dialogOpen} pending={unassignment.isPending} title="Desasignar ticket" />
  </section>;
}
