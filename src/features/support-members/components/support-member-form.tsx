"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/api-error";
import { apiFieldMessage, apiRequestId } from "@/lib/api/form-error";
import type { SupportMember } from "../api";
import { useCreateSupportMember, usePatchSupportMember } from "../mutations/support-members";
import { communityTypeNames, communityTypeOptions, normalizeSkills, supportAreaNames, supportAreaOptions, supportMemberFormValues, supportMemberSchema, supportRoleNames, supportRoleOptions, toCreateSupportMember, toSupportMemberPatch, type SupportMemberFormValues } from "../schemas/support-member";

export function SupportMemberForm({ member }: { member?: SupportMember }) {
  const router = useRouter(); const create = useCreateSupportMember(); const update = usePatchSupportMember(member?.id ?? ""); const locked = useRef(false);
  const [newSkill, setNewSkill] = useState("");
  const form = useForm<SupportMemberFormValues>({ resolver: zodResolver(supportMemberSchema), defaultValues: supportMemberFormValues(member) });
  const areas = useWatch({ control: form.control, name: "supportAreas" }) ?? [];
  const skills = useWatch({ control: form.control, name: "skills" }) ?? [];
  const mutation = member ? update : create; const pending = mutation.isPending || form.formState.isSubmitting;
  function toggleArea(area: SupportMember["supportAreas"][number], checked: boolean) {
    const next = checked ? [...areas, area] : areas.filter((value) => value !== area);
    form.setValue("supportAreas", next, { shouldDirty: true, shouldValidate: true });
  }
  function addSkill() {
    const next = normalizeSkills([...skills, newSkill]);
    form.setValue("skills", next, { shouldDirty: true, shouldValidate: true }); setNewSkill("");
  }
  async function submit(values: SupportMemberFormValues) {
    if (locked.current) return; locked.current = true; form.clearErrors();
    try {
      if (member) {
        const dirty = form.formState.dirtyFields;
        const body = toSupportMemberPatch(values, {
          fullName: !!dirty.fullName,
          role: !!dirty.role,
          supportAreas: !!dirty.supportAreas?.some(Boolean),
          skills: !!dirty.skills?.some(Boolean),
          isActive: !!dirty.isActive,
        });
        if (!Object.keys(body).length) { router.push(`/admin/support-members/${member.id}`); return; }
        await update.mutateAsync(body); router.push(`/admin/support-members/${member.id}`);
      } else {
        if (!values.communityType) {
          form.setError("communityType", { type: "validate", message: "Selecciona el tipo de comunidad." }, { shouldFocus: true });
          return;
        }
        const created = await create.mutateAsync(toCreateSupportMember({ ...values, communityType: values.communityType })); router.push(`/admin/support-members/${created.id}`);
      }
    } catch (error) {
      for (const field of ["fullName", "email", "institutionalId", "communityType", "role", "supportAreas", "skills", "isActive"] as const) {
        const message = apiFieldMessage(error, field);
        if (message) form.setError(field, { type: "server", message });
      }
    } finally { locked.current = false; }
  }
  const errors = form.formState.errors;
  const isDuplicate = mutation.error instanceof ApiError && mutation.error.status === 409;
  return <section className="grid min-w-0 gap-6">
    <PageHeader title={member ? "Editar integrante" : "Preprovisionar personal técnico"} description={member ? "Actualiza solo los campos que permite el servicio." : "Crea una cuenta de soporte sin contraseña ni envío de invitación."} breadcrumb={<Link className="text-primary hover:underline" href={member ? `/admin/support-members/${member.id}` : "/admin/support-members"}>Personal de soporte</Link>} />
    {!member && <div className="rounded-xl border border-info/30 bg-info/5 p-4 text-sm"><p className="font-medium">Cuenta preprovisionada</p><p className="mt-1 text-muted-foreground">Cuando la persona inicie sesión con Google usando este correo, el backend podrá enlazar la identidad y conservar su rol, áreas y habilidades. No se envía invitación ni se crean credenciales locales.</p></div>}
    <form aria-busy={pending} className="grid gap-5" noValidate onSubmit={(e) => { void form.handleSubmit(submit)(e); }}>
      <Card><CardHeader><CardTitle>Datos de la cuenta</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <Field id="support-full-name" label="Nombre completo" error={errors.fullName?.message}><Input autoComplete="name" id="support-full-name" readOnly={pending} {...form.register("fullName")} aria-invalid={!!errors.fullName} /></Field>
        <Field id="support-email" label="Correo institucional" error={errors.email?.message}><Input autoComplete="email" id="support-email" readOnly={pending || !!member} type="email" {...form.register("email")} aria-invalid={!!errors.email} />{member && <small className="text-muted-foreground">El correo no es editable desde este contrato.</small>}</Field>
        <Field id="support-institutional-id" label="Matrícula o número institucional" error={errors.institutionalId?.message}><Input id="support-institutional-id" readOnly={pending || !!member} {...form.register("institutionalId")} aria-invalid={!!errors.institutionalId} />{member && <small className="text-muted-foreground">Este identificador no es editable desde este contrato.</small>}</Field>
        <Field id="support-community-type" label="Tipo de comunidad" error={errors.communityType?.message}><Select disabled={pending || !!member} id="support-community-type" {...form.register("communityType")}><option value="">Selecciona un tipo</option>{communityTypeOptions.map((value) => <option key={value} value={value}>{communityTypeNames[value]}</option>)}</Select>{member && <small className="text-muted-foreground">El tipo de comunidad es informativo y no se incluye en PATCH.</small>}</Field>
        <Field id="support-role" label="Rol del sistema" error={errors.role?.message}><Select disabled={pending} id="support-role" {...form.register("role")}>{supportRoleOptions.map((value) => <option key={value} value={value}>{supportRoleNames[value]}</option>)}</Select></Field>
        {member && <label className="flex items-center gap-3 rounded-lg border p-3 text-sm md:col-span-2"><Checkbox disabled={pending} {...form.register("isActive")} />Cuenta activa <span className="text-xs text-muted-foreground">(PATCH permite cambiar el estado y reactivar)</span></label>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Áreas de soporte</CardTitle><p className="text-sm text-muted-foreground">Selecciona una o más áreas. La lista contiene los enums exactos de la API.</p></CardHeader><CardContent><fieldset className="grid gap-3 sm:grid-cols-2"><legend className="sr-only">Áreas asignadas</legend>{supportAreaOptions.map((area) => <label className="flex items-center gap-3 rounded-lg border p-3 text-sm" key={area}><Checkbox checked={areas.includes(area)} disabled={pending} onChange={(e) => toggleArea(area, e.target.checked)} />{supportAreaNames[area]}</label>)}</fieldset>{errors.supportAreas?.message && <p className="mt-2 text-sm text-danger-foreground" role="alert">{errors.supportAreas.message}</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Habilidades</CardTitle><p className="text-sm text-muted-foreground">Agrega habilidades como etiquetas; no hay un vocabulario fijo en el contrato.</p></CardHeader><CardContent className="grid gap-3"><div className="flex flex-wrap gap-2">{skills.map((skill, index) => <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm" key={`${skill}-${index}`}>{skill}<button aria-label={`Quitar habilidad ${skill}`} className="rounded-full px-1 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={pending} onClick={() => form.setValue("skills", skills.filter((_, i) => i !== index), { shouldDirty: true, shouldValidate: true })} type="button">×</button></span>)}</div><div className="flex gap-2"><Input aria-label="Nueva habilidad" disabled={pending} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Ej. mantenimiento preventivo" value={newSkill} /><Button disabled={pending || !newSkill.trim() || skills.includes(newSkill.trim())} onClick={addSkill} type="button" variant="secondary">Agregar habilidad</Button></div>{errors.skills?.message && <p className="text-sm text-danger-foreground" role="alert">{errors.skills.message}</p>}</CardContent></Card>
      {mutation.isError && <ErrorState title={isDuplicate ? "El correo o identificador institucional ya está registrado" : member ? "No se pudo guardar el integrante" : "No se pudo preprovisionar la cuenta"} message={mutation.error.message} requestId={apiRequestId(mutation.error)} />}
      <div className="flex justify-end gap-3"><Link className="inline-flex h-11 items-center rounded-lg border bg-surface px-4 text-sm font-medium" href={member ? `/admin/support-members/${member.id}` : "/admin/support-members"}>Cancelar</Link><Button disabled={pending} type="submit">{pending ? "Guardando…" : member ? "Guardar cambios" : "Preprovisionar cuenta"}</Button></div>
    </form>
  </section>;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return <div className="grid min-w-0 gap-1.5"><label className="text-sm font-medium" htmlFor={id}>{label}</label>{children}{error && <p className="text-sm text-danger-foreground" role="alert">{error}</p>}</div>;
}
