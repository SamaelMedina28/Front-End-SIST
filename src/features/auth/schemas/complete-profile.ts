import { z } from "zod";

import type { CompleteProfileInput } from "../api";

export const completeProfileSchema = z.object({
  institutionalId: z.string().trim().min(1, "Ingresa tu identificador institucional."),
  phone: z.string().trim(),
});

export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export function profileRequest(values: CompleteProfileFormValues): CompleteProfileInput {
  return {
    institutionalId: values.institutionalId.trim(),
    phone: values.phone.trim() || null,
  };
}
