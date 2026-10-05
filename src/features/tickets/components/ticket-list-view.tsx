"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ticketPriorityLabels, ticketStatusLabels } from "@/lib/constants/presentation";
import { ApiError } from "@/lib/api/api-error";
import type { Role } from "@/types/api";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/queries/current-user";
import { useSupportMembers } from "@/features/support-members/queries/support-members";
import type { SupportArea, TicketFilters } from "../api";
import { useTicketFormCatalog } from "../queries/ticket-form";
import { useTickets } from "../queries/tickets";
import { ticketFilterEntries, parseTicketFilters } from "../utils/ticket-filters";
import { TicketListItems } from "./ticket-list-items";
import { isSupportArea, supportAreaLabel } from "../utils/support-area";

function TicketListSkeleton() {
  return <div aria-label="Cargando tickets" className="grid gap-3" role="status">{[0, 1, 2, 3].map((item) => <div className="h-24 animate-pulse rounded-xl bg-muted" key={item} />)}</div>;
}

function Filters({ filters, role, supportAreas }: { filters: TicketFilters; role: Role; supportAreas: SupportArea[] }) {
  const router = useRouter();
  const admin = role === "ADMIN";
  const technical = role === "SUPPORT" || role === "SUB_MANAGER";
  const catalog = useTicketFormCatalog(true);
  const [categoryId, setCategoryId] = useState(filters.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(filters.subcategoryId ?? "");
  const [supportArea, setSupportArea] = useState(filters.supportArea ?? "");
  const [technicianSearch, setTechnicianSearch] = useState("");
  const selectedCategory = catalog.data?.categories.find((category) => category.id === categoryId);
  const supportMembersQuery = { page: 1, pageSize: 100, active: "true" as const, ...(supportArea ? { supportArea: supportArea as SupportArea } : {}), ...(technicianSearch.trim() ? { search: technicianSearch.trim() } : {}) };
  const technicians = useSupportMembers({ ...supportMembersQuery, role: "SUPPORT" }, admin);
  const subManagers = useSupportMembers({ ...supportMembersQuery, role: "SUB_MANAGER" }, admin);
  const staff = [...(technicians.data?.members ?? []), ...(subManagers.data?.members ?? [])].filter((member) => member.isActive);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = parseTicketFilters({
      search: String(form.get("search") ?? ""),
      status: String(form.get("status") ?? ""),
      priority: String(form.get("priority") ?? ""),
      categoryId,
      subcategoryId,
      sort: String(form.get("sort") ?? ""),
      order: String(form.get("order") ?? ""),
      assignment: role === "SUPPORT" || role === "SUB_MANAGER" ? String(form.get("assignment") ?? "") : undefined,
      supportArea: technical || admin ? String(form.get("supportArea") ?? "") : undefined,
      assignedTo: admin ? String(form.get("assignedTo") ?? "") : undefined,
      pageSize: filters.pageSize === undefined ? undefined : String(filters.pageSize),
      createdFrom: admin ? dateBoundary(String(form.get("createdFrom") ?? ""), false) : filters.createdFrom,
      createdTo: admin ? dateBoundary(String(form.get("createdTo") ?? ""), true) : filters.createdTo,
    });
    const query = ticketFilterEntries(parsed);
    router.push(query ? `/tickets?${query}` : "/tickets");
  }

  return <form className="grid gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4" onSubmit={submit}>
    <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-search">Buscar por código o título</label><Input id="ticket-search" name="search" defaultValue={filters.search ?? ""} placeholder="Buscar tickets" /></div>
    <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-status">Estado</label><Select defaultValue={filters.status ?? ""} id="ticket-status" name="status"><option value="">Todos</option>{Object.entries(ticketStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
    <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-priority">Prioridad</label><Select defaultValue={filters.priority ?? ""} id="ticket-priority" name="priority"><option value="">Todas</option>{Object.entries(ticketPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
    {(role === "SUPPORT" || role === "SUB_MANAGER" || admin) && <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-assignment">Asignación</label><Select defaultValue={filters.assignment ?? ""} id="ticket-assignment" name="assignment"><option value="">Todas</option><option value="unassigned">Sin asignar</option>{!admin && <option value="mine">Asignadas a mí</option>}<option value="assigned">Asignadas</option></Select></div>}
    {(role === "USER" || technical || admin) && <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-category">Categoría</label><Select disabled={catalog.isPending || catalog.isError} id="ticket-category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(""); }}><option value="">Todas</option>{catalog.data?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div>}
    {(role === "USER" || technical || admin) && <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-subcategory">Subcategoría</label><Select disabled={!selectedCategory} id="ticket-subcategory" value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)}><option value="">Todas</option>{selectedCategory?.subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</Select></div>}
    {(technical || admin) && <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-support-area">Área de soporte</label><Select defaultValue={filters.supportArea ?? ""} id="ticket-support-area" name="supportArea" onChange={(event) => setSupportArea(event.target.value)}><option value="">{admin ? "Todas las áreas" : "Todas mis áreas"}</option>{(admin ? ["HARDWARE", "SOFTWARE", "NETWORKS", "ADMINISTRATIVE"] as SupportArea[] : supportAreas).map((area) => <option key={area} value={area}>{supportAreaLabel(area)}</option>)}</Select></div>}
    {admin && <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-assigned-to-search">Buscar técnico</label><Input autoComplete="off" id="ticket-assigned-to-search" onChange={(event) => setTechnicianSearch(event.target.value)} placeholder="Nombre de técnico" value={technicianSearch} /></div>}
    {admin && <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-assigned-to">Técnico asignado</label><Select defaultValue={filters.assignedTo ?? ""} id="ticket-assigned-to" name="assignedTo"><option value="">Cualquier técnico</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.fullName} · {member.role === "SUPPORT" ? "Soporte" : "Subencargado"}</option>)}</Select><span className="text-xs text-muted-foreground">{technicians.isError || subManagers.isError ? "No se pudieron cargar técnicos para este filtro." : "Solo personal activo; usa la búsqueda para acotar la lista."}</span></div>}
    {admin && <><div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-created-from">Creado desde</label><Input defaultValue={filters.createdFrom?.slice(0, 10) ?? ""} id="ticket-created-from" name="createdFrom" type="date" /></div><div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-created-to">Creado hasta</label><Input defaultValue={filters.createdTo?.slice(0, 10) ?? ""} id="ticket-created-to" name="createdTo" type="date" /></div></>}
    <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-sort">Ordenar por</label><Select defaultValue={filters.sort ?? ""} id="ticket-sort" name="sort"><option value="">Predeterminado</option><option value="createdAt">Fecha de creación</option><option value="updatedAt">Última actualización</option><option value="priority">Prioridad</option><option value="status">Estado</option><option value="code">Código</option></Select></div>
    <div className="grid gap-1.5"><label className="text-xs font-medium" htmlFor="ticket-order">Dirección</label><Select defaultValue={filters.order ?? ""} id="ticket-order" name="order"><option value="">Predeterminada</option><option value="desc">Descendente</option><option value="asc">Ascendente</option></Select></div>
    <div className="flex items-end gap-2 xl:col-span-1"><Button className="w-full" type="submit" variant="secondary">Aplicar filtros</Button><Button className="shrink-0" onClick={() => router.push("/tickets")} type="button" variant="outline">Limpiar</Button></div>
    {catalog.isError && <p className="text-xs text-muted-foreground sm:col-span-2 xl:col-span-4">No se pudieron cargar las categorías; puedes filtrar por los demás campos. {catalog.error instanceof Error ? catalog.error.message : "Error inesperado."}</p>}
  </form>;
}

function dateBoundary(value: string, end: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return undefined;
  return `${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`;
}

export function TicketListExperience({ filters, role, supportAreas = [] }: { filters: TicketFilters; role: Role; supportAreas?: SupportArea[] }) {
  const router = useRouter();
  const technicalRole = role === "SUPPORT" || role === "SUB_MANAGER";
  const catalog = useTicketFormCatalog(role === "USER" || technicalRole);
  const scopedFilters = role === "USER" ? { ...filters, assignment: undefined, assignedTo: undefined, supportArea: undefined } : filters;
  const hasSubcategoryFilter = (role === "USER" || technicalRole || role === "ADMIN") && !!scopedFilters.subcategoryId;
  const catalogReady = catalog.isSuccess || catalog.isError;
  const validSubcategory = catalog.data?.categories.some((category) =>
    (!scopedFilters.categoryId || category.id === scopedFilters.categoryId)
    && category.subcategories.some((subcategory) => subcategory.id === scopedFilters.subcategoryId),
  );
  const safeFilters = hasSubcategoryFilter && catalogReady && !validSubcategory
    ? { ...scopedFilters, subcategoryId: undefined }
    : scopedFilters;
  const admin = role === "ADMIN";
  const query = useTickets(safeFilters, (role === "USER" || technicalRole || admin) && (!hasSubcategoryFilter || catalogReady));
  if (role !== "USER" && !technicalRole && !admin) return <ModulePlaceholder title="Tickets" description="Esta vista se implementará en la siguiente etapa." />;
  if (hasSubcategoryFilter && !catalogReady) return <TicketListSkeleton />;
  if (query.isPending) return <TicketListSkeleton />;
  if (query.isError) return <ErrorState title={admin ? "No se pudo cargar la administración de tickets" : role === "SUPPORT" || role === "SUB_MANAGER" ? "No se pudo cargar la cola de soporte" : "No se pudieron cargar tus tickets"} message={query.error instanceof Error ? query.error.message : "Ocurrió un error inesperado."} requestId={query.error instanceof ApiError ? query.error.requestId : undefined} onRetry={() => { void query.refetch(); }} />;
  if (!query.data) return <TicketListSkeleton />;

  const page = query.data;
  const hasFilters = !!(safeFilters.search || safeFilters.status || safeFilters.priority || safeFilters.categoryId || safeFilters.subcategoryId || safeFilters.assignment || safeFilters.supportArea || safeFilters.assignedTo || safeFilters.createdFrom || safeFilters.createdTo);
  const queryString = (nextPage: number) => {
    const search = ticketFilterEntries({ ...safeFilters, page: nextPage });
    return `/tickets?${search}`;
  };
  return <section className="grid min-w-0 gap-6">
    <PageHeader title={admin ? "Administración global de tickets" : technicalRole ? "Cola de soporte" : "Mis tickets"} description={admin ? "Consulta y administra tickets de toda la facultad." : technicalRole ? "Consulta y atiende tickets visibles para tus áreas de soporte." : "Consulta el estado y seguimiento de tus solicitudes."} actions={role === "USER" ? <Link className={cn(buttonVariants({ variant: "primary" }))} href="/tickets/new"><Plus aria-hidden="true" size={17} />Nuevo ticket</Link> : undefined} />
    <Filters filters={safeFilters} role={role} supportAreas={supportAreas} />
    {page.tickets.length === 0 ? <EmptyState title={hasFilters ? "No hay tickets que coincidan con estos filtros." : admin ? "No hay tickets registrados." : technicalRole ? "No hay solicitudes pendientes en tus áreas de soporte." : "Aún no tienes solicitudes de soporte."} description={admin ? "Los tickets globales aparecerán aquí cuando se registren." : technicalRole ? "Cuando haya tickets visibles para tus áreas, aparecerán en esta cola." : "Puedes crear una solicitud para recibir asistencia técnica."} action={role === "USER" ? <Link className={cn(buttonVariants({ variant: "primary", size: "sm" }))} href="/tickets/new"><Plus aria-hidden="true" size={16} />Crear ticket</Link> : undefined} />
      : <>
            <TicketListItems showAssignee={technicalRole || admin} tickets={page.tickets} />
            <nav aria-label="Paginación de tickets" className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">Página {page.meta.page} de {page.meta.totalPages} · {page.meta.total} tickets</p>
              <div className="flex gap-2"><Button disabled={page.meta.page <= 1} onClick={() => router.push(queryString(page.meta.page - 1))} size="sm" variant="outline"><ChevronLeft aria-hidden="true" size={16} />Anterior</Button><Button disabled={page.meta.page >= page.meta.totalPages} onClick={() => router.push(queryString(page.meta.page + 1))} size="sm" variant="outline">Siguiente<ChevronRight aria-hidden="true" size={16} /></Button></div>
            </nav>
      </>}
  </section>;
}

export function TicketListView({ filters }: { filters: TicketFilters }) {
  const { data: user } = useCurrentUser();
  if (!user) return <TicketListSkeleton />;
  const supportAreas = user.supportAreas.filter(isSupportArea);
  return <TicketListExperience filters={filters} role={user.role} supportAreas={supportAreas} />;
}
