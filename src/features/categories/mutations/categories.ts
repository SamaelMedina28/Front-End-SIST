"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketFormCatalogKey } from "@/features/tickets/queries/ticket-form";
import { createCategory, createSubcategory, deactivateCategory, deactivateSubcategory, updateCategory, updateSubcategory, type CreateCategoryRequest, type CreateSubcategoryRequest, type UpdateCategoryRequest, type UpdateSubcategoryRequest } from "../api";
import { categoriesKey } from "../queries/categories";

async function invalidateCategoryCatalog(client: ReturnType<typeof useQueryClient>) {
  await Promise.all([client.invalidateQueries({ queryKey: categoriesKey }), client.invalidateQueries({ queryKey: ticketFormCatalogKey })]);
}
export function useCreateCategory() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: CreateCategoryRequest) => createCategory(body), retry: false, onSuccess: () => invalidateCategoryCatalog(client) });
}
export function useUpdateCategory(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: UpdateCategoryRequest) => updateCategory(id, body), retry: false, onSuccess: () => invalidateCategoryCatalog(client) });
}
export function useDeactivateCategory() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deactivateCategory(id), retry: false, onSuccess: () => invalidateCategoryCatalog(client) });
}
export function useCreateSubcategory(categoryId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: CreateSubcategoryRequest) => createSubcategory(categoryId, body), retry: false, onSuccess: () => invalidateCategoryCatalog(client) });
}
export function useUpdateSubcategory(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: UpdateSubcategoryRequest) => updateSubcategory(id, body), retry: false, onSuccess: () => invalidateCategoryCatalog(client) });
}
export function useDeactivateSubcategory() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deactivateSubcategory(id), retry: false, onSuccess: () => invalidateCategoryCatalog(client) });
}
