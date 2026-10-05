import type { Role, TicketPriority, TicketStatus } from "@/types/api";

export type { Role, TicketPriority, TicketStatus };

export const ticketStatusLabels = {
  OPEN: "Abierto",
  IN_REVIEW: "En revisión",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
} satisfies Record<TicketStatus, string>;

export const ticketStatusTones = {
  OPEN: "neutral",
  IN_REVIEW: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
} satisfies Record<TicketStatus, SemanticTone>;

export const ticketPriorityLabels = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
} satisfies Record<TicketPriority, string>;

export const ticketPriorityTones = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "danger",
} satisfies Record<TicketPriority, SemanticTone>;

export const roleLabels = {
  USER: "Usuario",
  SUPPORT: "Soporte",
  SUB_MANAGER: "Subencargado",
  ADMIN: "Administrador",
} satisfies Record<Role, string>;

export type SemanticTone = "neutral" | "info" | "success" | "warning" | "danger";
