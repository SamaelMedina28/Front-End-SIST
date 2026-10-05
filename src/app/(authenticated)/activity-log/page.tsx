import { ActivityLogListView } from "@/features/activity-log/components/activity-log-list-view";
import type { ActivityLogFilters } from "@/features/activity-log/api";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function ActivityLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters: ActivityLogFilters = {};
  const search = first(params.search)?.trim();
  const ticketId = first(params.ticketId)?.trim();
  const from = first(params.from);
  const to = first(params.to);
  const status = first(params.status);
  const page = Number(first(params.page));
  const pageSize = Number(first(params.pageSize));
  if (search) filters.search = search;
  if (ticketId) filters.ticketId = ticketId;
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) filters.from = from;
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) filters.to = to;
  if (status === "IN_PROGRESS" || status === "COMPLETED") filters.status = status;
  if (Number.isSafeInteger(page) && page > 0) filters.page = page;
  if (Number.isSafeInteger(pageSize) && pageSize > 0 && pageSize <= 100) filters.pageSize = pageSize;
  return <ActivityLogListView filters={filters} key={JSON.stringify(filters)} />;
}
