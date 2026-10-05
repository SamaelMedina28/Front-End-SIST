"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { CurrentUser } from "@/features/auth/api";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFieldMessage, apiRequestId } from "@/lib/api/form-error";
import { roleLabels } from "@/lib/constants/presentation";
import { useUpdateUserProfile } from "../mutations/profile";
import { profileSchema, type ProfileFormValues } from "../schemas/profile";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const mutation = useUpdateUserProfile();
  const locked = useRef(false);
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user.fullName, phone: user.phone ?? "" },
  });
  const pending = mutation.isPending || isSubmitting;

  async function submit(values: ProfileFormValues) {
    if (locked.current) return;
    locked.current = true;
    clearErrors();
    try {
      await mutation.mutateAsync({ fullName: values.fullName.trim(), phone: values.phone.trim() || null });
    } catch (error) {
      let focus = true;
      for (const field of ["fullName", "phone"] as const) {
        const message = apiFieldMessage(error, field);
        if (message) {
          setError(field, { type: "server", message }, { shouldFocus: focus });
          focus = false;
        }
      }
    } finally {
      locked.current = false;
    }
  }

  const fieldError = (name: keyof ProfileFormValues) => errors[name]?.message
    ? <p className="text-sm text-danger-foreground" id={`${name}-error`} role="alert">{errors[name]?.message}</p>
    : null;

  return <section className="grid min-w-0 gap-6">
    <PageHeader title="Mi perfil" description="Actualiza los datos personales que el sistema permite editar." />
    <Card><CardHeader><CardTitle>Datos de la cuenta</CardTitle></CardHeader><CardContent>
      <form aria-busy={pending} className="grid min-w-0 gap-5 md:max-w-2xl" noValidate onSubmit={(event) => { void handleSubmit(submit)(event); }}>
        <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="profile-full-name">Nombre completo</label><Input id="profile-full-name" autoComplete="name" readOnly={pending} {...register("fullName")} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "fullName-error" : undefined} />{fieldError("fullName")}</div>
        <div className="grid gap-1.5"><label className="text-sm font-medium" htmlFor="profile-phone">Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></label><Input id="profile-phone" autoComplete="tel" readOnly={pending} {...register("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />{fieldError("phone")}</div>
        <div className="grid gap-1.5"><span className="text-sm font-medium">Correo electrónico</span><p className="min-h-11 break-all rounded-lg border bg-muted/50 px-3 py-3 text-sm" aria-label="Correo electrónico de la cuenta">{user.email}</p><span className="text-xs text-muted-foreground">El correo institucional no es editable desde este formulario.</span></div>
        <div className="grid gap-1.5"><span className="text-sm font-medium">Matrícula o número de empleado</span><p className="min-h-11 break-all rounded-lg border bg-muted/50 px-3 py-3 text-sm">{user.institutionalId}</p><span className="text-xs text-muted-foreground">Este dato es informativo y no se modifica aquí.</span></div>
        <div className="grid gap-1.5"><span className="text-sm font-medium">Rol</span><p className="text-sm text-muted-foreground">{roleLabels[user.role]}</p></div>
        {mutation.isSuccess && <p className="text-sm font-medium text-success-foreground" role="status">Perfil actualizado correctamente.</p>}
        {mutation.isError && <ErrorState title="No se pudo actualizar el perfil" message={mutation.error.message} requestId={apiRequestId(mutation.error)} />}
        <div><Button disabled={pending} type="submit">{pending ? "Guardando…" : "Guardar cambios"}</Button></div>
      </form>
    </CardContent></Card>
  </section>;
}
