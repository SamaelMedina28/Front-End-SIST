"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Pencil, RotateCcw, UserRoundX } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeactivateSupportMember, usePatchSupportMember } from "../mutations/support-members";
import { useSupportMember } from "../queries/support-members";
import { supportAreaNames } from "../schemas/support-member";
import { ApiError } from "@/lib/api/api-error";
import { apiRequestId } from "@/lib/api/form-error";
import { formatTicketDate } from "@/features/tickets/utils/format-date";

export function SupportMemberDetail({ id }: { id: string }) {
  const query = useSupportMember(id); const deactivate = useDeactivateSupportMember(id); const reactivate = usePatchSupportMember(id);
  const [confirmOpen, setConfirmOpen] = useState(false); const [statusError, setStatusError] = useState<unknown>();
  if (query.isPending) return <div aria-label="Cargando integrante" className="grid gap-4" role="status"><div className="h-20 animate-pulse rounded-xl bg-muted" /><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>;
  if (query.isError || !query.data) return <ErrorState title={query.error instanceof ApiError && query.error.status === 404 ? "No se encontró el integrante" : query.error instanceof ApiError && query.error.status === 403 ? "Acceso restringido" : "No se pudo cargar el integrante"} message={query.error instanceof Error ? query.error.message : "Error inesperado."} requestId={apiRequestId(query.error)} onRetry={() => { void query.refetch(); }} />;
  const member = query.data;
  async function changeActive(active: boolean) {
    setStatusError(undefined);
    try {
      if (active) await reactivate.mutateAsync({ isActive: true });
      else await deactivate.mutateAsync();
      setConfirmOpen(false);
    } catch (error) { setStatusError(error); }
  }
  return <section className="grid min-w-0 gap-6">
    <PageHeader title={member.fullName} description={`${member.email} · ${member.institutionalId}`} breadcrumb={<Link className="text-primary hover:underline" href="/admin/support-members">Personal de soporte</Link>} actions={<><Link className={buttonVariants({ variant: "outline" })} href={`/admin/support-members/${id}/edit`}><Pencil aria-hidden="true" size={16} />Editar</Link>{member.isActive ? <Button onClick={() => setConfirmOpen(true)} variant="danger"><UserRoundX aria-hidden="true" size={16} />Desactivar integrante</Button> : <Button disabled={reactivate.isPending} onClick={() => { void changeActive(true); }} variant="secondary"><RotateCcw aria-hidden="true" size={16} />Reactivar</Button>}</>} />
    {!!statusError && <ErrorState title={statusError instanceof ApiError && statusError.code === "SUPPORT_MEMBER_HAS_ACTIVE_TICKETS" ? "No se puede desactivar mientras tenga tickets activos asignados" : "No se pudo cambiar el estado"} message={statusError instanceof Error ? statusError.message : "La operación no se completó."} requestId={apiRequestId(statusError)} onRetry={() => { setStatusError(undefined); void query.refetch(); }} />}
    {reactivate.isError && !statusError && <ErrorState title="No se pudo reactivar el integrante" message={reactivate.error.message} requestId={apiRequestId(reactivate.error)} />}
    <Card><CardHeader><CardTitle>Perfil de soporte</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Detail label="Estado"><Badge tone={member.isActive ? "success" : "neutral"}>{member.isActive ? "Activo" : "Inactivo"}</Badge></Detail>
      <Detail label="Rol"><RoleBadge role={member.role} /></Detail>
      <Detail label="Áreas de soporte"><div className="flex flex-wrap gap-2">{member.supportAreas.length ? member.supportAreas.map((area) => <Badge key={area} tone="info">{supportAreaNames[area]}</Badge>) : <span>Sin áreas asignadas</span>}</div></Detail>
      <Detail label="Habilidades"><div className="flex flex-wrap gap-2">{member.skills.length ? member.skills.map((skill, index) => <Badge key={`${skill}-${index}`} tone="neutral">{skill}</Badge>) : <span>Sin habilidades registradas</span>}</div></Detail>
      <Detail label="Vínculo Google">{member.googleLinked ? "Vinculado" : "Pendiente de primer acceso"}</Detail>
      <Detail label="Último acceso">{member.lastLoginAt ? formatTicketDate(member.lastLoginAt) : "Sin acceso registrado"}</Detail>
      <Detail label="Cuenta creada">{formatTicketDate(member.createdAt)}</Detail>
      <Detail label="Última actualización">{formatTicketDate(member.updatedAt)}</Detail>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Vinculación con Google</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{member.googleLinked ? "La cuenta ya está vinculada con Google. Se conservan su rol, áreas y habilidades." : "La cuenta se vinculará automáticamente la primera vez que esta persona inicie sesión con Google usando el correo registrado. No se envían invitaciones ni se crean contraseñas."}</CardContent></Card>
    <ConfirmDialog confirmLabel="Desactivar integrante" description={<>La cuenta quedará inactiva; se conservarán los tickets, bitácoras y el vínculo de Google. Si tiene tickets abiertos, en revisión o en progreso asignados, no se podrá desactivar hasta reasignarlos o cerrarlos.</>} onConfirm={() => { void changeActive(false); }} onOpenChange={setConfirmOpen} open={confirmOpen} pending={deactivate.isPending} title="¿Desactivar este integrante?" />
  </section>;
}

function Detail({ label, children }: { label: string; children: ReactNode }) { return <div className="grid min-w-0 content-start gap-2"><p className="text-xs font-medium text-muted-foreground">{label}</p><div className="break-words text-sm">{children}</div></div>; }
