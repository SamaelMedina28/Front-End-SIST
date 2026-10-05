"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { shouldRetryQuery } from "@/lib/api/query-retry";
import { fetchCategories, type CategoryFilters } from "../api";

export const categoriesKey = ["categories"] as const;
export const categoriesListKey = (filters: CategoryFilters = {}) => [...categoriesKey, filters] as const;

export function categoriesOptions(filters: CategoryFilters = {}) {
  return queryOptions({ queryKey: categoriesListKey(filters), queryFn: ({ signal }) => fetchCategories(filters, signal), retry: shouldRetryQuery });
}
export function useCategories(filters: CategoryFilters = {}) { return useQuery(categoriesOptions(filters)); }
