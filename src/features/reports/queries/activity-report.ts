"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { shouldRetryQuery } from "@/lib/api/query-retry";
import { fetchActivityReport, type ActivityReportFilters } from "../api";

export const activityReportKey = (filters: ActivityReportFilters) => ["reports", "activity", filters] as const;

export function activityReportOptions(filters: ActivityReportFilters) {
  return queryOptions({
    queryKey: activityReportKey(filters),
    queryFn: ({ signal }) => fetchActivityReport(filters, signal),
    staleTime: 30_000,
    retry: shouldRetryQuery,
  });
}

export function useActivityReport(filters: ActivityReportFilters, enabled: boolean) {
  return useQuery({ ...activityReportOptions(filters), enabled });
}
