import { describe, expect, it } from "vitest";

import type { ActivityLogRevision } from "../api";
import { activityLogStatusLabel, revisionChanges } from "./presentation";

const revision: ActivityLogRevision = {
  id: "revision-1",
  changedBy: { id: "user-1", fullName: "Técnico" },
  createdAt: "2026-10-05T17:00:00.000Z",
  previousData: { activity: "Revisión inicial", participantIds: ["p1"], serviceStartedAt: "2026-10-05T16:00:00.000Z", serviceEndedAt: null, timeSpentMinutes: 60, status: "IN_PROGRESS" },
  newData: { activity: "Revisión inicial", participantIds: ["p1"], serviceStartedAt: "2026-10-05T16:00:00.000Z", serviceEndedAt: null, timeSpentMinutes: 75, status: "COMPLETED" },
};

describe("presentación de revisiones de bitácora", () => {
  it("muestra solo los campos modificados y sus etiquetas", () => {
    expect(revisionChanges(revision)).toEqual([
      { label: "Tiempo invertido", before: "60 min", after: "75 min" },
      { label: "Estado", before: "En proceso", after: "Finalizado" },
    ]);
  });

  it("usa fallback legible para estados futuros", () => {
    expect(activityLogStatusLabel("ARCHIVED")).toBe("ARCHIVED");
  });
});
