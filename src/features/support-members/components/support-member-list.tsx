"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoleBadge } from "@/components/shared/role-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatTicketDate } from "@/features/tickets/utils/format-date";
import { ApiError } from "@/lib/api/api-error";
import { apiRequestId } from "@/lib/api/form-error";
import { cn } from "@/lib/utils";
import type { SupportMemberFilters } from "../api";
import { useSupportMembers } from "../queries/support-members";
import { supportAreaNames, supportAreaOptions } from "../schemas/support-member";

function listUrl(filters: SupportMemberFilters, page: number) {
  const params = new URLSearchParams();
  Object.entries({ ...filters, page }).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return `/admin/support-members?${params.toString()}`;
}
function MemberSkeleton() { return <div aria-label="Cargando personal de soporte" className="grid gap-3" role="status">{[0, 1, 2, 3].map((row) => <div className="h-24 animate-pulse rounded-xl bg-muted" key={row} />)}</div>; }
function PaginationLink({ href, disabled, children }: { href: string; disabled: boolean; children: string }) {
  const className = cn(buttonVariants({ variant: "outline", size: "sm" }), disabled && "opacity-50");
  return disabled ? <span aria-disabled="true" className={className}>{children}</span> : <Link className={className} href={href}>{children}</Link>;
}

export function SupportMemberList({ filters }: { filters: SupportMemberFilters }) {
  const query = useSupportMembers(filters);
  if (query.isPending) return <MemberSkeleton />;
  if (query.isError) return <ErrorState title={query.error instanceof ApiError && query.error.status === 403 ? "Acceso restringido" : "No se pudo cargar el personal de soporte"} message={query.error instanceof Error ? query.error.message : "Error inesperado."} requestId={apiRequestId(query.error)} onRetry={() => { void query.refetch(); }} />;
  const { members, meta } = query.data;
  return <section className="grid min-w-0 gap-5">
    <PageHeader title="Personal de soporte" description="Preprovisiona y administra cuentas técnicas SUPPORT y SUB_MANAGER." actions={<Link className={cn(buttonVariants({ variant: "primary" }))} href="/admin/support-members/new"><UserPlus aria-hidden="true" size={16} />Preprovisionar cuenta</Link>} />
    <form action="/admin/support-members" className="grid gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="grid gap-1.5 lg:col-span-2"><label className="text-xs font-medium" htmlFor="members-search">Buscar</label><Input defaultValue={filters.search ?? ""} id="members-search" name="search" placeholder="Nombre, correo o número institucional" /></div>
      <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="members-role">Rol</label><Select defaultValue={filters.role ?? ""} id="members-role" name="role"><option value="">Todos los roles técnicos</option><option value="SUPPORT">Soporte</option><option value="SUB_MANAGER">Subencargado</option></Select></div>
      <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="members-area">Área</label><Select defaultValue={filters.supportArea ?? ""} id="members-area" name="supportArea"><option value="">Todas las áreas</option>{supportAreaOptions.map((area) => <option key={area} value={area}>{supportAreaNames[area]}</option>)}</Select></div>
      <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="members-active">Estado</label><Select defaultValue={filters.active ?? "true"} id="members-active" name="active"><option value="true">Activos</option><option value="false">Inactivos</option></Select></div>
      <div className="flex flex-wrap items-end gap-2 lg:col-span-5"><label className="grid gap-1.5 text-xs font-medium">Resultados por página<Select defaultValue={String(filters.pageSize ?? 20)} name="pageSize"><option value="10">10</option><option value="20">20</option><option value="50">50</option></Select></label><Button type="submit" variant="secondary">Aplicar filtros</Button><Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/support-members">Limpiar</Link></div>
    </form>
    {!members.length ? <EmptyState title="No se encontraron integrantes." description="Ajusta los filtros o preprovisiona una cuenta técnica." action={<Link className={cn(buttonVariants({ variant: "primary", size: "sm" }))} href="/admin/support-members/new">Preprovisionar cuenta</Link>} /> : <>
      <p aria-live="polite" className="text-sm text-muted-foreground">{meta.total} integrante{meta.total === 1 ? "" : "s"}</p>
      <div className="hidden overflow-x-auto rounded-xl border bg-surface md:block"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/50 text-xs text-muted-foreground"><tr>{["Nombre", "Rol", "Áreas", "Estado", "Google", "Último acceso"].map((label) => <th className="px-4 py-3 font-medium" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y">{members.map((member) => <tr className="hover:bg-muted/30" key={member.id}><td className="px-4 py-3"><Link className="font-medium text-primary hover:underline" href={`/admin/support-members/${member.id}`}>{member.fullName}</Link><p className="mt-1 break-all text-xs text-muted-foreground">{member.email}</p><p className="text-xs text-muted-foreground">{member.institutionalId}</p></td><td className="px-4 py-3"><RoleBadge role={member.role} /></td><td className="px-4 py-3">{member.supportAreas.map((area) => supportAreaNames[area]).join(", ") || "Sin áreas"}</td><td className="px-4 py-3"><Badge tone={member.isActive ? "success" : "neutral"}>{member.isActive ? "Activo" : "Inactivo"}</Badge></td><td className="px-4 py-3">{member.googleLinked ? "Vinculada" : "Pendiente"}</td><td className="px-4 py-3">{member.lastLoginAt ? formatTicketDate(member.lastLoginAt) : "Sin acceso"}</td></tr>)}</tbody></table></div>
      <ul className="grid gap-3 md:hidden">{members.map((member) => <li key={member.id}><Card><CardContent className="grid gap-3 pt-5"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><Link className="break-words font-semibold text-primary" href={`/admin/support-members/${member.id}`}>{member.fullName}</Link><p className="break-all text-sm text-muted-foreground">{member.email}</p><p className="text-xs text-muted-foreground">{member.institutionalId} · {member.communityType}</p></div><Badge tone={member.isActive ? "success" : "neutral"}>{member.isActive ? "Activo" : "Inactivo"}</Badge></div><div className="flex flex-wrap gap-2"><RoleBadge role={member.role} />{member.supportAreas.map((area) => <Badge key={area} tone="neutral">{supportAreaNames[area]}</Badge>)}</div><p className="text-xs text-muted-foreground">Google: {member.googleLinked ? "Vinculada" : "Pendiente"} · Último acceso: {member.lastLoginAt ? formatTicketDate(member.lastLoginAt) : "Sin acceso"}</p></CardContent></Card></li>)}</ul>
      <nav aria-label="Paginación del personal de soporte" className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">Página {meta.page} de {Math.max(meta.totalPages, 1)} · {meta.total} integrantes</p><div className="flex gap-2"><PaginationLink disabled={meta.page <= 1} href={listUrl(filters, Math.max(1, meta.page - 1))}>Anterior</PaginationLink><PaginationLink disabled={meta.page >= meta.totalPages} href={listUrl(filters, Math.max(1, Math.min(meta.totalPages || 1, meta.page + 1)))}>Siguiente</PaginationLink></div></nav>
    </>}
  </section>;
}
