import type { ActivityLogStatus, ActivityLogRevision } from "../api";

export const activityLogStatusLabels = {
  IN_PROGRESS: "En proceso",
  COMPLETED: "Finalizado",
} satisfies Record<ActivityLogStatus, string>;

export function activityLogStatusLabel(status: string) {
  return status in activityLogStatusLabels ? activityLogStatusLabels[status as ActivityLogStatus] : status;
}

type RevisionField = keyof ActivityLogRevision["newData"];
const revisionFieldLabels: Record<RevisionField, string> = {
  activity: "Actividad",
  participantIds: "Participantes",
  serviceStartedAt: "Inicio del servicio",
  serviceEndedAt: "Fin del servicio",
  timeSpentMinutes: "Tiempo invertido",
  status: "Estado",
};

function displayRevisionValue(field: RevisionField, value: unknown): string {
  if (field === "status" && typeof value === "string") return activityLogStatusLabel(value);
  if ((field === "serviceStartedAt" || field === "serviceEndedAt") && typeof value === "string") {
    return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Tijuana" }).format(new Date(value));
  }
  if (field === "timeSpentMinutes" && typeof value === "number") return `${value} min`;
  if (field === "participantIds" && Array.isArray(value)) return `${value.length} participante(s)`;
  return typeof value === "string" || typeof value === "number" ? String(value) : "—";
}

export function revisionChanges(revision: ActivityLogRevision) {
  const fields = Object.keys(revision.newData) as RevisionField[];
  return fields.flatMap((field) => {
    const before = revision.previousData[field];
    const after = revision.newData[field];
    if (JSON.stringify(before) === JSON.stringify(after)) return [];
    return [{ label: revisionFieldLabels[field], before: displayRevisionValue(field, before), after: displayRevisionValue(field, after) }];
  });
}
