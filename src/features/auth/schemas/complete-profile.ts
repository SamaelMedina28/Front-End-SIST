import { z } from "zod";

import type { CommunityType, CompleteProfileInput } from "../api";

export const communityLabels = {
  STUDENT: "Estudiante",
  TEACHER: "Docente",
  ADMINISTRATIVE: "Administrativo",
} satisfies Record<CommunityType, string>;

// Visual choices are checked against the generated enum; Express owns business validation.
const communityType = z.custom<CommunityType>(
  (value) => typeof value === "string" && Object.hasOwn(communityLabels, value),
  "Selecciona tu comunidad universitaria.",
);

export const completeProfileSchema = z.object({
  institutionalId: z.string().trim().min(1, "Ingresa tu identificador institucional."),
  communityType,
  phone: z.string().trim(),
});

export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export function profileRequest(values: CompleteProfileFormValues): CompleteProfileInput {
  return {
    institutionalId: values.institutionalId.trim(),
    communityType: values.communityType,
    phone: values.phone.trim() || null,
  };
}
