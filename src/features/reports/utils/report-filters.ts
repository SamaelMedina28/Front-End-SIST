import type { components } from "@/types/api.generated";
import type { ActivityReportFilters } from "../api";
import { currentMonthRange, isDateOnly } from "./date-only";

type SearchParams = Record<string, string | string[] | undefined>;
type ParsedReportFilters = { filters: ActivityReportFilters; rangeValid: boolean; shouldPersistDefaultRange: boolean };
const supportAreas = ["HARDWARE", "SOFTWARE", "NETWORKS", "ADMINISTRATIVE"] satisfies components["schemas"]["Category"]["supportArea"][];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function validUuid(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value) ? value : undefined;
}

export function parseActivityReportFilters(params: SearchParams, defaults = currentMonthRange()): ParsedReportFilters {
  const rawFrom = first(params.from);
  const rawTo = first(params.to);
  const from = rawFrom && isDateOnly(rawFrom) ? rawFrom : defaults.from;
  const to = rawTo && isDateOnly(rawTo) ? rawTo : defaults.to;
  const rawArea = first(params.supportArea);
  return {
    filters: {
      from,
      to,
      supportArea: supportAreas.find((area) => area === rawArea),
      categoryId: validUuid(first(params.categoryId)),
      technicianId: validUuid(first(params.technicianId)),
    },
    rangeValid: from <= to,
    shouldPersistDefaultRange: !rawFrom && !rawTo,
  };
}

export function activityReportFilterEntries(filters: ActivityReportFilters) {
  const entries = Object.entries(filters).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "");
  return new URLSearchParams(entries).toString();
}
