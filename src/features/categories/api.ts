import { ApiError } from "@/lib/api/api-error";
import { getBrowserClient } from "@/lib/api/browser-client";
import { requestApi } from "@/lib/api/request";
import type { components, paths } from "@/types/api.generated";

export type Category = components["schemas"]["Category"];
export type Subcategory = components["schemas"]["Subcategory"];
export type CreateCategoryRequest = components["schemas"]["CreateCategoryInput"];
export type UpdateCategoryRequest = components["schemas"]["UpdateCategoryInput"];
export type CreateSubcategoryRequest = components["schemas"]["CreateSubcategoryInput"];
export type UpdateSubcategoryRequest = components["schemas"]["UpdateSubcategoryInput"];
export type SupportArea = Category["supportArea"];
export type CategoryPriority = NonNullable<Category["defaultPriority"]>;
export type SubcategoryPriority = NonNullable<Subcategory["priority"]>;
export type CategoryFilters = NonNullable<paths["/api/v1/categories"]["get"]["parameters"]["query"]>;

export async function fetchCategories(filters: CategoryFilters = {}, signal?: AbortSignal): Promise<Category[]> {
  const data = await requestApi(() => getBrowserClient().GET("/api/v1/categories", { params: { query: filters }, signal }));
  if (!Array.isArray(data)) throw ApiError.unexpected();
  return data;
}

export async function createCategory(body: CreateCategoryRequest): Promise<Category> {
  const data = await requestApi(() => getBrowserClient().POST("/api/v1/categories", { body }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}
export async function updateCategory(id: string, body: UpdateCategoryRequest): Promise<Category> {
  const data = await requestApi(() => getBrowserClient().PATCH("/api/v1/categories/{id}", { params: { path: { id } }, body }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}
export async function deactivateCategory(id: string) {
  await requestApi(() => getBrowserClient().DELETE("/api/v1/categories/{id}", { params: { path: { id } } }));
}
export async function createSubcategory(categoryId: string, body: CreateSubcategoryRequest): Promise<Subcategory> {
  const data = await requestApi(() => getBrowserClient().POST("/api/v1/categories/{categoryId}/subcategories", { params: { path: { categoryId } }, body }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}
export async function updateSubcategory(id: string, body: UpdateSubcategoryRequest): Promise<Subcategory> {
  const data = await requestApi(() => getBrowserClient().PATCH("/api/v1/subcategories/{id}", { params: { path: { id } }, body }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}
export async function deactivateSubcategory(id: string) {
  await requestApi(() => getBrowserClient().DELETE("/api/v1/subcategories/{id}", { params: { path: { id } } }));
}
