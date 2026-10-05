"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError, isRecord } from "@/lib/api/api-error";
import { useCompleteProfile } from "../mutations/session";
import { communityLabels, completeProfileSchema, profileRequest, type CompleteProfileFormValues } from "../schemas/complete-profile";
import { AuthError } from "./auth-error";

export function CompleteProfileForm() {
  const mutation = useCompleteProfile();
  const locked = useRef(false);
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { institutionalId: "", phone: "" },
  });
  const pending = mutation.isPending || isSubmitting || mutation.isSuccess;
  async function submit(values: CompleteProfileFormValues) {
    if (locked.current) return;
    locked.current = true;
    clearErrors();
    try { await mutation.mutateAsync(profileRequest(values)); }
    catch (error) {
      if (error instanceof ApiError && isRecord(error.fields)) {
        let focus = true;
        for (const field of ["institutionalId", "communityType", "phone"] as const) {
          const messages = error.fields[field];
          if (Array.isArray(messages) && messages.every((message): message is string => typeof message === "string") && messages.length) {
            setError(field, { type: "server", message: messages.join(" ") }, { shouldFocus: focus });
            focus = false;
          }
        }
      }
      locked.current = false;
    }
  }
  return <form noValidate onSubmit={handleSubmit(submit)} className="space-y-5" aria-busy={pending}>
    <div className="space-y-2"><label htmlFor="institutionalId" className="text-sm font-medium">Matrícula o número de empleado <span aria-hidden="true">*</span></label>
      <Input id="institutionalId" autoComplete="off" readOnly={pending} required {...register("institutionalId")} aria-invalid={!!errors.institutionalId} aria-describedby={errors.institutionalId ? "institutionalId-error" : undefined} />
      {errors.institutionalId && <p id="institutionalId-error" role="alert" className="text-sm text-danger-foreground">{errors.institutionalId.message}</p>}
    </div>
    <div className="space-y-2"><label htmlFor="communityType" className="text-sm font-medium">Comunidad universitaria <span aria-hidden="true">*</span></label>
      <Select id="communityType" required disabled={pending} defaultValue="" {...register("communityType")} aria-invalid={!!errors.communityType} aria-describedby={errors.communityType ? "communityType-error" : undefined}>
        <option value="" disabled>Selecciona una opción</option>
        {Object.entries(communityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </Select>
      {errors.communityType && <p id="communityType-error" role="alert" className="text-sm text-danger-foreground">{errors.communityType.message}</p>}
    </div>
    <div className="space-y-2"><label htmlFor="phone" className="text-sm font-medium">Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></label>
      <Input id="phone" type="tel" autoComplete="tel" readOnly={pending} {...register("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />
      {errors.phone && <p id="phone-error" role="alert" className="text-sm text-danger-foreground">{errors.phone.message}</p>}
    </div>
    {mutation.isError && <AuthError error={mutation.error} />}
    <p className="text-xs text-muted-foreground">* Campos obligatorios</p>
    <Button className="w-full" type="submit" disabled={pending}>{pending ? "Guardando…" : "Completar registro"}</Button>
    <span role="status" className="sr-only">{pending ? "Guardando tu registro y verificando la sesión." : ""}</span>
  </form>;
}
