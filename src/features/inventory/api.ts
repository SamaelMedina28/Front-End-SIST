import { ApiError } from "@/lib/api/api-error";
import { getBrowserClient } from "@/lib/api/browser-client";
import { requestApi, requestApiEnvelope } from "@/lib/api/request";
import type { components, paths } from "@/types/api.generated";

export type InventoryItem = components["schemas"]["InventoryItem"];
export type InventoryListItem = components["schemas"]["InventoryListItem"];
export type InventoryHistoryItem = components["schemas"]["InventoryTicketHistoryItem"];
export type CreateInventoryRequest = components["schemas"]["CreateInventoryRequest"];
export type PatchInventoryRequest = components["schemas"]["PatchInventoryRequest"];
export type InventoryFilters = NonNullable<paths["/api/v1/inventory"]["get"]["parameters"]["query"]>;
export type InventoryHistoryFilters = NonNullable<paths["/api/v1/inventory/{id}/tickets"]["get"]["parameters"]["query"]>;
export type InventoryPageMeta = components["schemas"]["PaginatedInventoryResponse"]["meta"];
export type InventoryHistoryPageMeta = components["schemas"]["PaginatedInventoryTicketHistoryResponse"]["meta"];

function assertItem(data: InventoryItem | undefined): InventoryItem {
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}

function assertMeta(meta: unknown): InventoryPageMeta {
  if (!meta || typeof meta !== "object" || !("page" in meta && typeof meta.page === "number" && "pageSize" in meta && typeof meta.pageSize === "number" && "total" in meta && typeof meta.total === "number" && "totalPages" in meta && typeof meta.totalPages === "number")) throw ApiError.unexpected();
  return { page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages };
}

export async function fetchInventory(filters: InventoryFilters, signal?: AbortSignal) {
  const envelope = await requestApiEnvelope<InventoryListItem[], InventoryPageMeta>(() => getBrowserClient().GET("/api/v1/inventory", { params: { query: filters }, signal }));
  return { items: envelope.data, meta: assertMeta(envelope.meta) };
}

export async function fetchInventoryItem(id: string, signal?: AbortSignal) {
  return assertItem(await requestApi(() => getBrowserClient().GET("/api/v1/inventory/{id}", { params: { path: { id } }, signal })));
}

export async function fetchInventoryHistory(id: string, filters: InventoryHistoryFilters, signal?: AbortSignal) {
  const envelope = await requestApiEnvelope<InventoryHistoryItem[], InventoryHistoryPageMeta>(() => getBrowserClient().GET("/api/v1/inventory/{id}/tickets", { params: { path: { id }, query: filters }, signal }));
  return { items: envelope.data, meta: assertMeta(envelope.meta) };
}

export async function createInventoryItem(body: CreateInventoryRequest) {
  return assertItem(await requestApi(() => getBrowserClient().POST("/api/v1/inventory", { body })));
}

export async function patchInventoryItem(id: string, body: PatchInventoryRequest) {
  return assertItem(await requestApi(() => getBrowserClient().PATCH("/api/v1/inventory/{id}", { params: { path: { id } }, body })));
}

export async function deactivateInventoryItem(id: string) {
  await requestApi(() => getBrowserClient().DELETE("/api/v1/inventory/{id}", { params: { path: { id } } }));
}
