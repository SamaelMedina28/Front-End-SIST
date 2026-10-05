import { describe, expect, it } from "vitest";

import { roleLabels, ticketPriorityLabels, ticketPriorityTones, ticketStatusLabels, ticketStatusTones } from "../src/lib/constants/presentation";

describe("presentation labels", () => {
  it("translates ticket statuses without changing backend enum keys", () => {
    expect(ticketStatusLabels).toEqual({
      OPEN: "Abierto",
      IN_REVIEW: "En revisión",
      IN_PROGRESS: "En proceso",
      COMPLETED: "Finalizado",
      CANCELLED: "Cancelado",
    });
  });

  it("translates priorities and assigns semantic tones", () => {
    expect(ticketPriorityLabels).toEqual({ LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" });
    expect(ticketPriorityTones).toEqual({ LOW: "neutral", MEDIUM: "warning", HIGH: "danger" });
  });

  it("translates roles while preserving their keys", () => {
    expect(roleLabels).toEqual({ USER: "Usuario", SUPPORT: "Soporte", SUB_MANAGER: "Subencargado", ADMIN: "Administrador" });
  });

  it("keeps every status mapped to a semantic tone", () => {
    expect(Object.keys(ticketStatusLabels)).toEqual(Object.keys(ticketStatusTones));
  });
});
