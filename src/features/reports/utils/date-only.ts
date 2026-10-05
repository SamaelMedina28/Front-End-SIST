export type DateOnlyRange = { from: string; to: string };

export function isDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= monthLengths[month - 1]!;
}

export function currentMonthRange(now = new Date()): DateOnlyRange {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tijuana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const to = `${fields.year}-${fields.month}-${fields.day}`;
  return { from: `${fields.year}-${fields.month}-01`, to };
}

export function isValidDateRange(from: string, to: string) {
  return isDateOnly(from) && isDateOnly(to) && from <= to;
}

export function formatDateOnly(value: string) {
  if (!isDateOnly(value)) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function formatResolutionMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes < 0) return "—";
  const format = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 });
  if (minutes < 60) return `${format.format(minutes)} min`;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes - days * 1440) / 60);
  const remainder = minutes - days * 1440 - hours * 60;
  const parts = [];
  if (days) parts.push(`${format.format(days)} d`);
  if (hours) parts.push(`${format.format(hours)} h`);
  if (remainder > 0 || parts.length === 0) parts.push(`${format.format(remainder)} min`);
  return parts.join(" ");
}
