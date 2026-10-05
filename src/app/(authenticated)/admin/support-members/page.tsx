import { SupportMemberList } from "@/features/support-members/components/support-member-list";
import type { SupportMemberFilters } from "@/features/support-members/api";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function SupportMembersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters: SupportMemberFilters = {};
  const search = first(params.search)?.trim();
  const page = Number(first(params.page)); const pageSize = Number(first(params.pageSize));
  const role = first(params.role); const area = first(params.supportArea); const active = first(params.active);
  if (search) filters.search = search;
  if (role === "SUPPORT" || role === "SUB_MANAGER") filters.role = role;
  if (area === "HARDWARE" || area === "SOFTWARE" || area === "NETWORKS" || area === "ADMINISTRATIVE") filters.supportArea = area;
  if (active === "true" || active === "false") filters.active = active;
  if (Number.isSafeInteger(page) && page > 0) filters.page = page;
  if (Number.isSafeInteger(pageSize) && pageSize >= 10 && pageSize <= 100) filters.pageSize = pageSize;
  return <SupportMemberList filters={filters} key={JSON.stringify(filters)} />;
}
