import { InventoryList } from "@/features/inventory/components/inventory-list";
import type { InventoryFilters } from "@/features/inventory/api";

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters: InventoryFilters = {};
  const search = first(params.search)?.trim(); const building = first(params.building)?.trim();
  const page = Number(first(params.page)); const pageSize = Number(first(params.pageSize));
  const type = first(params.type); const active = first(params.active);
  if (search) filters.search = search;
  if (building) filters.building = building;
  if (type === "COMPUTER" || type === "PROJECTOR" || type === "CONTROL" || type === "ADAPTER") filters.type = type;
  if (active === "true" || active === "false") filters.active = active;
  if (Number.isSafeInteger(page) && page > 0) filters.page = page;
  if (Number.isSafeInteger(pageSize) && pageSize > 0 && pageSize <= 100) filters.pageSize = pageSize;
  return <InventoryList filters={filters} key={JSON.stringify(filters)} />;
}
