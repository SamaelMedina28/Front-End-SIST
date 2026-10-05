"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, CircleCheck, LoaderCircle, UserRoundPlus } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import type { CurrentUser } from "@/features/auth/api";
import type { TicketDetail, TicketStatus } from "../api";
import { useAssignTicketToSelf, useChangeTicketStatus } from "../mutations/support-actions";
import { isSupportArea, supportAreaLabel } from "../utils/support-area";

const transitions: Partial<Record<TicketStatus, TicketStatus[]>> = {
  OPEN: ["IN_REVIEW", "IN_PROGRESS", "CANCELLED"],
  IN_REVIEW: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

const statusActionLabels: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_REVIEW: "Marcar en revisión",
  IN_PROGRESS: "Iniciar atención",
  COMPLETED: "Completar ticket",
  CANCELLED: "Cancelar ticket",
};

function isTerminal(status: string): status is "COMPLETED" | "CANCELLED" {
  return status === "COMPLETED" || status === "CANCELLED";
}

function errorMessage(error: Error) {
  if (error instanceof ApiError && error.status === 409) return error.message;
  return error.message;
}

export function SupportTicketActions({ ticket, user, onRefresh }: { ticket: TicketDetail; user: CurrentUser; onRefresh: () => void }) {
  const assignMutation = useAssignTicketToSelf(ticket.id);
  const statusMutation = useChangeTicketStatus(ticket.id);
  const pendingRef = useRef(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"assign" | TicketStatus>();
  const [cancelNote, setCancelNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const isPending = assignMutation.isPending || statusMutation.isPending;
  const area = isSupportArea(ticket.category.supportArea) ? ticket.category.supportArea : undefined;
  const inMyArea = area !== undefined && user.supportAreas.includes(area);
  const assignedToMe = ticket.assignee?.id === user.id;
  const terminal = isTerminal(ticket.status);
  const canAssign = inMyArea && !ticket.assignee && !terminal && ["OPEN", "IN_REVIEW", "IN_PROGRESS"].includes(ticket.status);
  const allowedNext = transitions[ticket.status as TicketStatus] ?? [];

  function openConfirmation(action: "assign" | TicketStatus) {
    setDialogAction(action);
    setNoteError("");
    if (action === "CANCELLED") setCancelNote("");
    setDialogOpen(true);
  }

  function submitStatus(status: TicketStatus, note?: string) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    statusMutation.mutate({
      body: status === "CANCELLED" ? { status, note: note?.trim() } : { status },
      idempotencyKey: globalThis.crypto.randomUUID(),
    }, { onSettled: () => { pendingRef.current = false; setDialogOpen(false); setDialogAction(undefined); setCancelNote(""); } });
  }

  function confirmAction() {
    if (pendingRef.current || !dialogAction) return;
    if (dialogAction === "assign") {
      pendingRef.current = true;
      assignMutation.mutate(undefined, { onSettled: () => { pendingRef.current = false; setDialogOpen(false); setDialogAction(undefined); } });
      return;
    }
    if (dialogAction === "CANCELLED" && !cancelNote.trim()) {
      setNoteError("Escribe una nota para cancelar el ticket.");
      return;
    }
    submitStatus(dialogAction, dialogAction === "CANCELLED" ? cancelNote : undefined);
  }

  const mutationError = assignMutation.error ?? statusMutation.error;
  const dialogCopy = dialogAction === "assign"
    ? { title: "Tomar este ticket", description: "El ticket quedará asignado a tu cuenta. Si otro técnico lo toma antes, el servidor conservará la asignación válida.", label: "Confirmar toma" }
    : dialogAction === "COMPLETED"
      ? { title: "Completar ticket", description: "Esta acción finalizará la atención. Confirma que el trabajo quedó completado.", label: "Confirmar finalización" }
      : { title: "Cancelar ticket", description: "La cancelación es terminal y requiere una nota para el historial.", label: "Confirmar cancelación" };

  return <section aria-labelledby="support-actions-title" className="grid min-w-0 gap-4 rounded-xl border bg-surface p-5">
    <div><h2 className="text-base font-semibold" id="support-actions-title">Acciones de soporte</h2><p className="mt-1 text-sm text-muted-foreground">{area ? `Área: ${supportAreaLabel(area)}` : "Área de soporte no identificada en el contrato."}</p></div>
    {terminal ? <p className="rounded-lg border bg-muted p-3 text-sm" role="status">Este ticket ya está finalizado.</p>
      : !inMyArea ? <p className="rounded-lg border bg-muted p-3 text-sm" role="status">Este ticket no corresponde a las áreas configuradas para tu cuenta. Las acciones están ocultas.</p>
        : assignedToMe ? <div className="grid gap-3">
          <p className="text-sm">Este ticket está asignado a ti. Puedes avanzar solo a los estados disponibles.</p>
          <div className="flex flex-wrap gap-2">{allowedNext.map((status) => {
            const terminalAction = status === "COMPLETED" || status === "CANCELLED";
            return <Button disabled={isPending} key={status} onClick={() => terminalAction ? openConfirmation(status) : submitStatus(status)} variant={status === "CANCELLED" ? "outline" : "primary"}>
              {isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={16} />Actualizando estado…</> : <>{status === "COMPLETED" ? <CircleCheck aria-hidden="true" size={16} /> : status === "CANCELLED" ? <AlertTriangle aria-hidden="true" size={16} /> : <Check aria-hidden="true" size={16} />}{statusActionLabels[status]}</>}
            </Button>;
          })}</div>
        </div>
          : ticket.assignee ? <p className="rounded-lg border bg-muted p-3 text-sm" role="status">Este ticket está asignado a {ticket.assignee.fullName ?? "otro técnico"}. La vista es de solo lectura.</p>
            : canAssign ? <div className="grid gap-3 sm:flex sm:items-center sm:justify-between"><p className="text-sm">Este ticket está sin asignar y pertenece a una de tus áreas.</p><Button disabled={isPending} onClick={() => openConfirmation("assign")}><UserRoundPlus aria-hidden="true" size={16} />Tomar ticket</Button></div>
              : <p className="text-sm text-muted-foreground">No hay acciones de soporte disponibles para el estado actual.</p>}
    {(assignMutation.isSuccess || statusMutation.isSuccess) && <p aria-live="polite" className="text-sm text-success" role="status">{assignMutation.isSuccess ? "Ticket asignado correctamente." : "Estado actualizado."}</p>}
    {mutationError && <div className="grid gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3" role="alert"><p className="text-sm">{errorMessage(mutationError)}</p>{mutationError instanceof ApiError && mutationError.requestId && <p className="text-xs text-muted-foreground">Solicitud: {mutationError.requestId}</p>}<Button className="w-fit" onClick={onRefresh} size="sm" variant="outline">Volver a consultar el ticket</Button></div>}
    <ConfirmDialog
      confirmLabel={dialogCopy.label}
      description={dialogCopy.description}
      onConfirm={confirmAction}
      onOpenChange={(open) => { if (!isPending) setDialogOpen(open); }}
      open={dialogOpen}
      pending={isPending}
      title={dialogCopy.title}
    >
      {dialogAction === "CANCELLED" && <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="support-cancel-note">Nota de cancelación</label><textarea aria-invalid={!!noteError} aria-describedby={noteError ? "support-cancel-note-error" : undefined} className="min-h-24 rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" id="support-cancel-note" onChange={(event) => { setCancelNote(event.target.value); setNoteError(""); }} value={cancelNote} /><p className="text-xs text-muted-foreground">La API requiere una nota para cancelar.</p>{noteError && <p className="text-sm text-destructive" id="support-cancel-note-error" role="alert">{noteError}</p>}</div>}
    </ConfirmDialog>
  </section>;
}
