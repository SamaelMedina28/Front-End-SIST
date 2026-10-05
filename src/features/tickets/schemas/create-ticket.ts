import { z } from "zod";

import type { CreateTicketRequest, TicketFormCategory } from "../api";
import { countWords } from "../utils/description-words";

export const createTicketSchema = z.object({
  title: z.string().trim().min(1, "Ingresa un título."),
  categoryId: z.string().min(1, "Selecciona una categoría."),
  subcategoryId: z.string(),
  building: z.string().trim().min(1, "Ingresa el edificio."),
  room: z.string().trim(),
  description: z.string().trim().min(1, "Describe el problema.").refine((value) => countWords(value) <= 50, "La descripción no puede superar 50 palabras."),
  contactPhone: z.string().trim(),
  softwareName: z.string().trim(),
  softwareVersion: z.string().trim(),
  softwareDownloadUrl: z.string().trim(),
  coordinationApprovalReference: z.string().trim(),
});

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export function createTicketRequest(values: CreateTicketFormValues, category: TicketFormCategory): CreateTicketRequest {
  const software = category.requiresSoftwareDetails
    ? {
        name: values.softwareName.trim(),
        version: values.softwareVersion.trim(),
        downloadUrl: values.softwareDownloadUrl.trim(),
        coordinationApprovalReference: values.coordinationApprovalReference.trim(),
      }
    : undefined;

  return {
    title: values.title.trim(),
    categoryId: category.id,
    ...(category.subcategories.length > 0 ? { subcategoryId: values.subcategoryId || null } : {}),
    building: values.building.trim(),
    room: values.room.trim() || null,
    description: values.description.trim(),
    contactPhone: values.contactPhone.trim() || null,
    ...(software ? { software } : {}),
  };
}
