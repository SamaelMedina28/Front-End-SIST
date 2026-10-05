"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInventoryItem, deactivateInventoryItem, patchInventoryItem, type CreateInventoryRequest, type PatchInventoryRequest } from "../api";
import { inventoryDetailKey, inventoryKey } from "../queries/inventory";

export function useCreateInventoryItem() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: CreateInventoryRequest) => createInventoryItem(body), retry: false, onSuccess: async () => client.invalidateQueries({ queryKey: inventoryKey }) });
}
export function usePatchInventoryItem(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: PatchInventoryRequest) => patchInventoryItem(id, body), retry: false, onSuccess: async () => Promise.all([client.invalidateQueries({ queryKey: inventoryKey }), client.invalidateQueries({ queryKey: inventoryDetailKey(id) })]) });
}
export function useDeactivateInventoryItem(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: () => deactivateInventoryItem(id), retry: false, onSuccess: async () => Promise.all([client.invalidateQueries({ queryKey: inventoryKey }), client.invalidateQueries({ queryKey: inventoryDetailKey(id) })]) });
}
