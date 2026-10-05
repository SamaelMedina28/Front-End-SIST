export const ticketStatusLabels = {
  OPEN: "Abierto",
  IN_REVIEW: "En revisión",
  IN_PROGRESS: "En proceso",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
} as const;

export const ticketStatusTones = {
  OPEN: "neutral",
  IN_REVIEW: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
} as const;

export const ticketPriorityLabels = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
} as const;

export const ticketPriorityTones = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "danger",
} as const;

export const roleLabels = {
  USER: "Usuario",
  SUPPORT: "Soporte",
  SUB_MANAGER: "Subencargado",
  ADMIN: "Administrador",
} as const;

export type TicketStatus = keyof typeof ticketStatusLabels;
export type TicketPriority = keyof typeof ticketPriorityLabels;
export type Role = keyof typeof roleLabels;
export type SemanticTone = "neutral" | "info" | "success" | "warning" | "danger";
