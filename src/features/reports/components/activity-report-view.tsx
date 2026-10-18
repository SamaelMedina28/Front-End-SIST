"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChartNoAxesColumn, Clock3, ListChecks, TicketCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCategories } from "@/features/categories/queries/categories";
import { supportAreaLabels } from "@/features/categories/schemas/category";
import { useSupportMembers } from "@/features/support-members/queries/support-members";
import { ApiError } from "@/lib/api/api-error";
import { roleLabels } from "@/lib/constants/presentation";
import { useActivityReport } from "../queries/activity-report";
import type { ActivityReport, ActivityReportFilters } from "../api";
import { formatDateOnly, formatResolutionMinutes, isDateOnly, isValidDateRange } from "../utils/date-only";
import { activityReportFilterEntries } from "../utils/report-filters";

const numberFormat = new Intl.NumberFormat("es-MX");

function ReportSkeleton() {
  return <div aria-label="Cargando reporte" className="grid gap-6" role="status">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div className="h-36 animate-pulse rounded-xl bg-muted" key={item} />)}</div>
    {[0, 1, 2].map((item) => <div className="h-64 animate-pulse rounded-xl bg-muted" key={item} />)}
  </div>;
}

function Summary({ report }: { report: ActivityReport }) {
  const { summary } = report;
  return <div aria-label="Resumen del periodo" className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <MetricCard title="Tickets creados" value={numberFormat.format(summary.ticketsCreated)} description="Por fecha de creación dentro del periodo" icon={TicketCheck} />
    <MetricCard title="Tickets completados" value={numberFormat.format(summary.ticketsCompleted)} description="Completados dentro del periodo, aunque se crearan antes" icon={ListChecks} />
    <MetricCard title="Pendientes" value={numberFormat.format(summary.pending)} description="Creados en el periodo y activos actualmente" icon={ChartNoAxesColumn} />
    <MetricCard title="Resolución promedio" value={formatResolutionMinutes(summary.averageResolutionMinutes)} description="Tiempo promedio de los tickets completados en el periodo" icon={Clock3} />
  </div>;
}

function hasActivity(report: ActivityReport) {
  return report.summary.ticketsCreated > 0 || report.summary.ticketsCompleted > 0 || report.summary.pending > 0
    || report.byCategory.some((item) => item.count > 0)
    || report.byTechnician.some((item) => item.completed > 0 || item.active > 0)
    || report.daily.some((item) => item.created > 0 || item.completed > 0);
}

function CategoryActivity({ report }: { report: ActivityReport }) {
  const maximum = Math.max(1, ...report.byCategory.map((item) => item.count));
  return <section aria-labelledby="report-category-title" className="grid min-w-0 gap-4 rounded-xl border bg-surface p-4 sm:p-5">
    <div><h2 className="text-base font-semibold" id="report-category-title">Tickets creados por categoría</h2><p className="mt-1 text-sm text-muted-foreground">Total de tickets por categoría en el periodo y filtros seleccionados.</p></div>
    {report.byCategory.length === 0 ? <p className="text-sm text-muted-foreground">No hay categorías con actividad.</p> : <ul className="grid gap-4">{report.byCategory.map((item) => <li className="grid min-w-0 gap-2" key={item.categoryId}>
      <div className="flex min-w-0 items-baseline justify-between gap-3"><span className="truncate text-sm font-medium">{item.category}</span><span className="shrink-0 text-sm tabular-nums">{numberFormat.format(item.count)}</span></div>
      <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, (item.count / maximum) * 100)}%` }} /></div>
    </li>)}</ul>}
  </section>;
}

function TechnicianActivity({ report }: { report: ActivityReport }) {
  return <section aria-labelledby="report-technician-title" className="grid min-w-0 gap-4 rounded-xl border bg-surface p-4 sm:p-5">
    <div><h2 className="text-base font-semibold" id="report-technician-title">Actividad por técnico</h2><p className="mt-1 text-sm text-muted-foreground">Tickets activos de cada técnico y los que completó en el periodo.</p></div>
    {report.byTechnician.length === 0 ? <p className="text-sm text-muted-foreground">No hay actividad de técnicos para estos filtros.</p> : <ul className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">{report.byTechnician.map((item) => <li className="grid min-w-0 gap-3 rounded-lg border p-4" key={item.technicianId}>
      <h3 className="break-words font-medium">{item.name}</h3>
      <dl className="grid grid-cols-2 gap-3"><div><dt className="text-xs text-muted-foreground">Activos</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{numberFormat.format(item.active)}</dd></div><div><dt className="text-xs text-muted-foreground">Completados</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{numberFormat.format(item.completed)}</dd></div></dl>
    </li>)}</ul>}
  </section>;
}

function DailyActivity({ report }: { report: ActivityReport }) {
  const maximum = Math.max(1, ...report.daily.flatMap((item) => [item.created, item.completed]));
  return <section aria-labelledby="report-daily-title" className="grid min-w-0 gap-4 rounded-xl border bg-surface p-4 sm:p-5">
    <div><h2 className="text-base font-semibold" id="report-daily-title">Actividad diaria</h2><p className="mt-1 text-sm text-muted-foreground">Tickets creados y completados cada día del periodo.</p></div>
    <div aria-label="Leyenda de actividad diaria" className="flex flex-wrap gap-4 text-xs"><span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-sm bg-primary" />Creados</span><span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-sm bg-accent" />Completados</span></div>
    {report.daily.length === 0 ? <p className="text-sm text-muted-foreground">No hay datos diarios para mostrar.</p> : <ol aria-label="Tickets creados y completados por día" className="grid min-w-0 gap-2">{report.daily.map((item) => <li className="grid min-w-0 gap-2 rounded-lg border p-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center" key={item.date}>
      <time className="text-xs font-medium tabular-nums" dateTime={item.date}>{formatDateOnly(item.date)}</time>
      <div className="grid min-w-0 gap-2"><div className="grid grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-xs"><span>Creados</span><div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, (item.created / maximum) * 100)}%` }} /></div><span className="text-right tabular-nums">{numberFormat.format(item.created)}</span></div><div className="grid grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-xs"><span>Completados</span><div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(0, (item.completed / maximum) * 100)}%` }} /></div><span className="text-right tabular-nums">{numberFormat.format(item.completed)}</span></div></div>
    </li>)}</ol>}
  </section>;
}

function ReportResults({ report, filters }: { report: ActivityReport; filters: ActivityReportFilters }) {
  return <div className="grid min-w-0 gap-6">
    <Summary report={report} />
    {!hasActivity(report) ? <EmptyState title="No hay actividad para los filtros seleccionados." description={`Periodo: ${formatDateOnly(filters.from)}–${formatDateOnly(filters.to)}. No se registraron tickets en este periodo.`} /> : <>
      <CategoryActivity report={report} />
      <TechnicianActivity report={report} />
      <DailyActivity report={report} />
    </>}
  </div>;
}

export function ActivityReportView({ filters, rangeValid, shouldPersistDefaultRange }: { filters: ActivityReportFilters; rangeValid: boolean; shouldPersistDefaultRange: boolean }) {
  const router = useRouter();
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);
  const [area, setArea] = useState<NonNullable<ActivityReportFilters["supportArea"]> | "">(filters.supportArea ?? "");
  const [categoryId, setCategoryId] = useState(filters.categoryId ?? "");
  const [technicianId, setTechnicianId] = useState(filters.technicianId ?? "");
  const [candidateSearchInput, setCandidateSearchInput] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [formError, setFormError] = useState("");
  const categories = useCategories();
  const memberFilters = useMemo(() => ({ page: 1, pageSize: 100, search: candidateSearch.trim() || undefined }), [candidateSearch]);
  const supportActive = useSupportMembers({ ...memberFilters, role: "SUPPORT", active: "true" }, true);
  const subManagerActive = useSupportMembers({ ...memberFilters, role: "SUB_MANAGER", active: "true" }, true);
  const supportInactive = useSupportMembers({ ...memberFilters, role: "SUPPORT", active: "false" }, true);
  const subManagerInactive = useSupportMembers({ ...memberFilters, role: "SUB_MANAGER", active: "false" }, true);
  const candidates = [...(supportActive.data?.members ?? []), ...(subManagerActive.data?.members ?? []), ...(supportInactive.data?.members ?? []), ...(subManagerInactive.data?.members ?? [])]
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "es-MX") || left.id.localeCompare(right.id));
  const candidatesError = supportActive.error ?? subManagerActive.error ?? supportInactive.error ?? subManagerInactive.error;
  const report = useActivityReport(filters, rangeValid);

  useEffect(() => {
    if (!shouldPersistDefaultRange) return;
    router.replace(`/reports?${activityReportFilterEntries(filters)}`, { scroll: false });
  }, [filters, router, shouldPersistDefaultRange]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDateOnly(from) || !isDateOnly(to)) {
      setFormError("Selecciona fechas válidas para el periodo.");
      return;
    }
    if (!isValidDateRange(from, to)) {
      setFormError("La fecha «Desde» debe ser anterior o igual a «Hasta».");
      return;
    }
    setFormError("");
    const nextFilters: ActivityReportFilters = {
      from,
      to,
      supportArea: area || undefined,
      categoryId: categoryId || undefined,
      technicianId: technicianId || undefined,
    };
    router.push(`/reports?${activityReportFilterEntries(nextFilters)}`);
  }

  const areaOptions = Object.keys(supportAreaLabels) as (keyof typeof supportAreaLabels)[];
  return <section className="grid min-w-0 gap-6">
    <PageHeader title="Reportes de actividad" description="Consulta la actividad de soporte por periodo, área y categoría." />
    <form className="grid min-w-0 gap-4 rounded-xl border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-3" onSubmit={submit}>
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="report-from">Desde</label><Input id="report-from" max={to} onChange={(event) => { setFrom(event.target.value); setFormError(""); }} required type="date" value={from} /></div>
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="report-to">Hasta</label><Input id="report-to" min={from} onChange={(event) => { setTo(event.target.value); setFormError(""); }} required type="date" value={to} /></div>
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="report-area">Área de soporte</label><Select id="report-area" onChange={(event) => setArea(event.target.value as NonNullable<ActivityReportFilters["supportArea"]> | "")} value={area}><option value="">Todas las áreas</option>{areaOptions.map((option) => <option key={option} value={option}>{supportAreaLabels[option]}</option>)}</Select></div>
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="report-category">Categoría</label><Select disabled={categories.isPending || categories.isError} id="report-category" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}><option value="">Todas las categorías</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select>{categories.isError && <span className="text-xs text-destructive">No se pudieron cargar las categorías; los demás filtros siguen disponibles.</span>}</div>
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="report-technician-search">Buscar técnico</label><div className="flex gap-2"><Input autoComplete="off" id="report-technician-search" onChange={(event) => setCandidateSearchInput(event.target.value)} placeholder="Nombre" value={candidateSearchInput} /><Button disabled={candidateSearchInput.trim() === candidateSearch.trim()} onClick={() => { setCandidateSearch(candidateSearchInput.trim()); setTechnicianId(""); }} size="sm" type="button" variant="secondary">Buscar</Button></div></div>
      <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="report-technician">Técnico</label><Select disabled={!!candidatesError && candidates.length === 0} id="report-technician" onChange={(event) => setTechnicianId(event.target.value)} value={technicianId}><option value="">Todos los técnicos</option>{candidates.map((member) => <option key={member.id} value={member.id}>{member.fullName} · {roleLabels[member.role]}{member.isActive ? "" : " · Inactivo"}</option>)}</Select>{!!candidatesError && <span className="text-xs text-destructive">{candidatesError instanceof Error ? candidatesError.message : "No se pudo cargar el personal."}{candidatesError instanceof ApiError && candidatesError.requestId ? ` · Solicitud: ${candidatesError.requestId}` : ""}</span>}</div>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-3"><Button type="submit">Aplicar filtros</Button><Button onClick={() => router.push("/reports")} type="button" variant="outline">Limpiar filtros (volver al mes actual)</Button></div>
      {formError && <p className="text-sm text-destructive sm:col-span-2 xl:col-span-3" role="alert">{formError}</p>}
      {!rangeValid && !formError && <p className="text-sm text-destructive sm:col-span-2 xl:col-span-3" role="alert">El periodo recibido no es válido. Corrige las fechas para consultar el reporte.</p>}
    </form>
    {!rangeValid ? null : report.isPending ? <ReportSkeleton /> : report.isError ? <ErrorState title="No se pudo cargar el reporte" message={report.error instanceof Error ? report.error.message : "Ocurrió un error inesperado."} requestId={report.error instanceof ApiError ? report.error.requestId : undefined} onRetry={() => { void report.refetch(); }} /> : report.data ? <ReportResults filters={filters} report={report.data} /> : null}
  </section>;
}
