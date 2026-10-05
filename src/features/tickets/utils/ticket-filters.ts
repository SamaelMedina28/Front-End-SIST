import { ticketPriorityLabels, ticketStatusLabels } from "@/lib/constants/presentation";
import type { TicketFilters } from "@/features/tickets/api";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: SearchParams[string]) {
  return typeof value === "string" ? value : undefined;
}

function positiveInteger(value: string | undefined) {
  if (!value || !/^\d+$/u.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
}

function isKeyOf<T extends object>(record: T, value: string | undefined): value is keyof T & string {
  return value !== undefined && Object.hasOwn(record, value);
}

function validUuid(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
    ? value
    : undefined;
}

function validInstant(value: string | undefined) {
  return value && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

export function parseTicketFilters(params: SearchParams): TicketFilters {
  const search = first(params.search)?.trim();
  const sort = first(params.sort);
  const order = first(params.order);
  const status = first(params.status);
  const priority = first(params.priority);
  return {
    page: positiveInteger(first(params.page)),
    pageSize: positiveInteger(first(params.pageSize)),
    search: search || undefined,
    status: isKeyOf(ticketStatusLabels, status) ? status : undefined,
    priority: isKeyOf(ticketPriorityLabels, priority) ? priority : undefined,
    categoryId: validUuid(first(params.categoryId)),
    subcategoryId: validUuid(first(params.subcategoryId)),
    createdFrom: validInstant(first(params.createdFrom)),
    createdTo: validInstant(first(params.createdTo)),
    sort: sort === "createdAt" || sort === "updatedAt" || sort === "priority" || sort === "status" || sort === "code" ? sort : undefined,
    order: order === "asc" || order === "desc" ? order : undefined,
  };
}

export function ticketFilterEntries(filters: TicketFilters) {
  const entries = Object.entries(filters).filter((entry): entry is [string, string | number] => entry[1] !== undefined && entry[1] !== "");
  return new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
}
