import { z } from "zod";
import type { Category, CategoryPriority, CreateCategoryRequest, CreateSubcategoryRequest, Subcategory, UpdateCategoryRequest, UpdateSubcategoryRequest } from "../api";

export const supportAreaOptions = ["HARDWARE", "SOFTWARE", "NETWORKS", "ADMINISTRATIVE"] as const satisfies readonly Category["supportArea"][];
export const priorityOptions = ["LOW", "MEDIUM", "HIGH"] as const satisfies readonly CategoryPriority[];
export const supportAreaLabels: Record<Category["supportArea"], string> = { HARDWARE: "Hardware", SOFTWARE: "Software", NETWORKS: "Redes", ADMINISTRATIVE: "Administrativo" };
export const priorityLabels: Record<CategoryPriority, string> = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" };

export const categorySchema = z.object({ code: z.string().regex(/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/, "Usa el formato UPPER_SNAKE_CASE, por ejemplo, SOPORTE_PROYECTOR."), name: z.string().trim().min(1, "Ingresa un nombre."), supportArea: z.enum(supportAreaOptions), defaultPriority: z.union([z.enum(priorityOptions), z.literal("")]), requiresSoftwareDetails: z.boolean(), isActive: z.boolean() });
export type CategoryFormValues = z.infer<typeof categorySchema>;
export const blankCategory: CategoryFormValues = { code: "", name: "", supportArea: "HARDWARE", defaultPriority: "", requiresSoftwareDetails: false, isActive: true };
export function categoryFormValues(category?: Category): CategoryFormValues {
  return category ? { code: category.code, name: category.name, supportArea: category.supportArea, defaultPriority: category.defaultPriority ?? "", requiresSoftwareDetails: category.requiresSoftwareDetails, isActive: category.isActive } : blankCategory;
}
export function toCreateCategory(values: CategoryFormValues): CreateCategoryRequest {
  return { code: values.code.trim(), name: values.name.trim(), supportArea: values.supportArea, defaultPriority: values.defaultPriority || null, requiresSoftwareDetails: values.requiresSoftwareDetails };
}
export function toCategoryPatch(values: CategoryFormValues, dirty: Partial<Record<keyof CategoryFormValues, boolean>>): UpdateCategoryRequest {
  const body: UpdateCategoryRequest = {};
  if (dirty.name) body.name = values.name.trim();
  if (dirty.supportArea) body.supportArea = values.supportArea;
  if (dirty.defaultPriority) body.defaultPriority = values.defaultPriority || null;
  if (dirty.requiresSoftwareDetails) body.requiresSoftwareDetails = values.requiresSoftwareDetails;
  if (dirty.isActive) body.isActive = values.isActive;
  return body;
}

export const subcategorySchema = z.object({ code: z.string().trim().min(1, "Ingresa un código."), name: z.string().trim().min(1, "Ingresa un nombre."), priority: z.union([z.enum(priorityOptions), z.literal("")]), isActive: z.boolean() });
export type SubcategoryFormValues = z.infer<typeof subcategorySchema>;
export const blankSubcategory: SubcategoryFormValues = { code: "", name: "", priority: "", isActive: true };
export function subcategoryFormValues(subcategory?: Subcategory): SubcategoryFormValues {
  return subcategory ? { code: subcategory.code, name: subcategory.name, priority: subcategory.priority ?? "", isActive: subcategory.isActive } : blankSubcategory;
}
export function toCreateSubcategory(values: SubcategoryFormValues): CreateSubcategoryRequest {
  return { code: values.code.trim(), name: values.name.trim(), priority: values.priority || null };
}
export function toSubcategoryPatch(values: SubcategoryFormValues, dirty: Partial<Record<keyof SubcategoryFormValues, boolean>>): UpdateSubcategoryRequest {
  const body: UpdateSubcategoryRequest = {};
  if (dirty.name) body.name = values.name.trim();
  if (dirty.priority) body.priority = values.priority || null;
  if (dirty.isActive) body.isActive = values.isActive;
  return body;
}
