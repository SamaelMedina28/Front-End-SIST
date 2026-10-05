"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/api-error";
import { formatTicketDate } from "@/features/tickets/utils/format-date";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/queries/current-user";
import { useActivityLog, useActivityLogHistory } from "../queries/activity-log";
import { activityLogStatusLabels, revisionChanges } from "../utils/presentation";
import { ActivityLogEditForm } from "./activity-log-form";

function DetailSkeleton() { return <div aria-label="Cargando detalle de bitácora" className="grid gap-5" role="status"><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>; }

function History({ id }: { id: string }) {
  const query = useActivityLogHistory(id, true);
  if (query.isPending) return <div aria-label="Cargando historial" className="grid gap-3" role="status">{[0, 1].map((key) => <div className="h-24 animate-pulse rounded-lg bg-muted" key={key} />)}</div>;
  if (query.isError) return <ErrorState title="No se pudo cargar el historial" message={query.error instanceof Error ? query.error.message : "Error inesperado."} requestId={query.error instanceof ApiError ? query.error.requestId : undefined} onRetry={() => { void query.refetch(); }} />;
  if (!query.data.length) return <p className="text-sm text-muted-foreground">Esta entrada aún no tiene revisiones.</p>;
  return <ol className="grid gap-4">{query.data.map((revision, index) => { const changes = revisionChanges(revision); return <li className="rounded-lg border p-4" key={revision.id}><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-medium">Revisión {index + 1} · {revision.changedBy.fullName}</h3><time className="text-xs text-muted-foreground" dateTime={revision.createdAt}>{formatTicketDate(revision.createdAt)}</time></div>{changes.length ? <ul className="mt-3 grid gap-2">{changes.map((change) => <li className="grid gap-1 text-sm sm:grid-cols-[10rem_1fr]" key={change.label}><span className="font-medium">{change.label}</span><span className="break-words"><span>{change.before}</span><span aria-hidden="true"> → </span><span className="font-medium">{change.after}</span></span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No se detectaron cambios en los campos conocidos.</p>}</li>; })}</ol>;
}

export function ActivityLogDetail({ id }: { id: string }) {
  const query = useActivityLog(id);
  const { data: user } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  if (query.isPending) return <DetailSkeleton />;
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    const forbidden = query.error instanceof ApiError && query.error.status === 403;
    return <div className="grid gap-4"><PageHeader title={notFound ? "Registro no encontrado" : forbidden ? "Acceso restringido" : "Error al consultar la bitácora"} /><ErrorState title={notFound ? "No encontramos esta actividad" : "No se pudo cargar la actividad"} message={query.error instanceof Error ? query.error.message : "Error inesperado."} requestId={query.error instanceof ApiError ? query.error.requestId : undefined} onRetry={() => { void query.refetch(); }} action={<Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/activity-log">Volver a bitácora</Link>} /></div>;
  }
  const entry = query.data;
  const canEdit = user?.role === "SUB_MANAGER";
  return <article className="grid min-w-0 gap-5"><PageHeader breadcrumb={<Link className="inline-flex items-center gap-1 hover:text-foreground" href="/activity-log"><ArrowLeft aria-hidden="true" size={14} />Bitácora</Link>} title={`Actividad · ${entry.ticket.code}`} description={entry.ticket.title} actions={canEdit && !editing ? <Button onClick={() => setEditing(true)} variant="secondary"><Pencil aria-hidden="true" size={16} />Editar</Button> : undefined} />
    {editing ? <ActivityLogEditForm entry={entry} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} /> : <>
      <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Registro de servicio</CardTitle><Badge tone={entry.status === "COMPLETED" ? "success" : "warning"}>{activityLogStatusLabels[entry.status]}</Badge></div></CardHeader><CardContent><p className="whitespace-pre-wrap break-words text-sm leading-6">{entry.activity}</p><dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs text-muted-foreground">Falla reportada (snapshot)</dt><dd className="mt-1 whitespace-pre-wrap font-medium">{entry.failure}</dd></div><div><dt className="text-xs text-muted-foreground">Inicio de servicio</dt><dd className="mt-1 font-medium">{formatTicketDate(entry.serviceStartedAt)}</dd></div><div><dt className="text-xs text-muted-foreground">Fin de servicio</dt><dd className="mt-1 font-medium">{formatTicketDate(entry.serviceEndedAt)}</dd></div><div><dt className="text-xs text-muted-foreground">Tiempo invertido</dt><dd className="mt-1 font-medium">{entry.timeSpentMinutes} min</dd></div><div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Participantes</dt><dd className="mt-1 font-medium">{entry.participants.map((participant) => participant.fullName).join(", ") || "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Registro creado por</dt><dd className="mt-1 font-medium">{entry.createdBy.fullName}</dd></div></dl></CardContent></Card>
      <Card><CardHeader><CardTitle>Snapshot del ticket y reportero</CardTitle></CardHeader><CardContent><p className="font-medium">{entry.ticket.code} · {entry.ticket.title}</p><dl className="mt-4 grid gap-4 sm:grid-cols-3"><div><dt className="text-xs text-muted-foreground">Reportó</dt><dd className="mt-1 font-medium">{entry.reporter.fullName}</dd></div><div><dt className="text-xs text-muted-foreground">Correo snapshot</dt><dd className="mt-1 break-all font-medium">{entry.reporter.email}</dd></div><div><dt className="text-xs text-muted-foreground">Teléfono snapshot</dt><dd className="mt-1 font-medium">{entry.reporter.phone ?? "—"}</dd></div></dl><p className="mt-4 text-xs text-muted-foreground">El ticket y reportero mostrados son los snapshots guardados al registrar la actividad.</p></CardContent></Card>
      {(user?.role === "SUB_MANAGER" || user?.role === "ADMIN") && <Card><CardHeader><CardTitle>Historial de revisiones</CardTitle></CardHeader><CardContent><History id={id} /></CardContent></Card>}
    </>}</article>;
}
