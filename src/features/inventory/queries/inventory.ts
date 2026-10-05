"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { shouldRetryQuery } from "@/lib/api/query-retry";
import { fetchInventory, fetchInventoryHistory, fetchInventoryItem, type InventoryFilters, type InventoryHistoryFilters } from "../api";

export const inventoryKey = ["inventory"] as const;
export const inventoryListKey = (filters: InventoryFilters) => [...inventoryKey, "list", filters] as const;
export const inventoryDetailKey = (id: string) => [...inventoryKey, "detail", id] as const;
export const inventoryHistoryKey = (id: string, filters: InventoryHistoryFilters) => [...inventoryKey, id, "tickets", filters] as const;

export function useInventory(filters: InventoryFilters) {
  return useQuery(queryOptions({ queryKey: inventoryListKey(filters), queryFn: ({ signal }) => fetchInventory(filters, signal), retry: shouldRetryQuery }));
}
export function useInventoryItem(id: string) {
  return useQuery(queryOptions({ queryKey: inventoryDetailKey(id), queryFn: ({ signal }) => fetchInventoryItem(id, signal), retry: shouldRetryQuery, enabled: !!id }));
}
export function useInventoryHistory(id: string, filters: InventoryHistoryFilters) {
  return useQuery(queryOptions({ queryKey: inventoryHistoryKey(id, filters), queryFn: ({ signal }) => fetchInventoryHistory(id, filters, signal), retry: shouldRetryQuery, enabled: !!id }));
}
