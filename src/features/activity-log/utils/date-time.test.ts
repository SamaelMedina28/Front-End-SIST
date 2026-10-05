import { describe, expect, it } from "vitest";

import { isoToTijuanaInput, tijuanaInputToIso } from "./date-time";

describe("conversiones locales de bitácora America/Tijuana", () => {
  it("convierte una hora de Tijuana a ISO UTC y de regreso sin desplazarla", () => {
    expect(tijuanaInputToIso("2026-10-05T10:00")).toBe("2026-10-05T17:00:00.000Z");
    expect(isoToTijuanaInput("2026-10-05T17:00:00.000Z")).toBe("2026-10-05T10:00");
  });

  it("no serializa entradas incompletas o inexistentes en el cambio horario", () => {
    expect(tijuanaInputToIso("2026-03-08T02:30")).toBeUndefined();
    expect(tijuanaInputToIso("2026-03-08")).toBeUndefined();
  });
});
