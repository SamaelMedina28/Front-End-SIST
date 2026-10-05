import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Ingresa tu nombre."),
  phone: z.string().trim(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
