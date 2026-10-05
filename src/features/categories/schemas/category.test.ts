import { describe, expect, it } from "vitest";
import { categoryFormValues, categorySchema, subcategoryFormValues, subcategorySchema, toCategoryPatch, toCreateCategory, toCreateSubcategory, toSubcategoryPatch } from "./category";
import type { Category, Subcategory } from "../api";

const category: Category = { id: "c1", code: "SOFTWARE", name: "Software", supportArea: "SOFTWARE", defaultPriority: null, requiresSoftwareDetails: true, isActive: true, subcategories: [] };
const subcategory: Subcategory = { id: "s1", categoryId: "c1", code: "INSTALL", name: "Instalación", priority: null, isActive: true };

describe("category and subcategory schemas", () => {
  it("creates categories with the exact request fields and nullable priority", () => {
    const values = { ...categoryFormValues(), code: "NEW_CATEGORY", name: "Nueva categoría", supportArea: "NETWORKS" as const, defaultPriority: "" as const, requiresSoftwareDetails: true };
    expect(categorySchema.safeParse(values).success).toBe(true);
    expect(toCreateCategory(values)).toEqual({ code: "NEW_CATEGORY", name: "Nueva categoría", supportArea: "NETWORKS", defaultPriority: null, requiresSoftwareDetails: true });
  });
  it("enforces the documented code format and maps only dirty patch fields", () => {
    expect(categorySchema.safeParse({ ...categoryFormValues(), code: "bad-code", name: "x" }).success).toBe(false);
    const values = { ...categoryFormValues(category), name: "Software académico", defaultPriority: "HIGH" as const };
    expect(toCategoryPatch(values, { name: true, defaultPriority: true, code: true })).toEqual({ name: "Software académico", defaultPriority: "HIGH" });
  });
  it("supports inherited nullable subcategory priority without sending categoryId in the body", () => {
    const values = { ...subcategoryFormValues(), code: "SETUP", name: "Instalación" };
    expect(subcategorySchema.safeParse(values).success).toBe(true);
    expect(toCreateSubcategory(values)).toEqual({ code: "SETUP", name: "Instalación", priority: null });
    expect(toSubcategoryPatch({ ...subcategoryFormValues(subcategory), priority: "" }, { priority: true })).toEqual({ priority: null });
    expect(toSubcategoryPatch({ ...values, isActive: false }, { isActive: true })).toEqual({ isActive: false });
  });
});
