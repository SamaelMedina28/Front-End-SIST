const timeZone = "America/Tijuana";

function partsInTijuana(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

export function isoToTijuanaInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = partsInTijuana(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Interpret a datetime-local value explicitly as America/Tijuana, then serialize to UTC ISO. */
export function tijuanaInputToIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day, hour, minute] = match;
  const intendedUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  let utcMillis = intendedUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = partsInTijuana(new Date(utcMillis));
    const representedUtc = Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day), Number(local.hour), Number(local.minute));
    const correction = intendedUtc - representedUtc;
    utcMillis += correction;
    if (correction === 0) break;
  }
  const result = new Date(utcMillis);
  return isoToTijuanaInput(result.toISOString()) === value ? result.toISOString() : undefined;
}
