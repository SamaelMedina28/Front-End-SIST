"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { shouldRetryQuery } from "@/lib/api/query-retry";
import { fetchAdminDashboard, fetchSupportDashboard, fetchUserDashboard } from "../api";

export const dashboardKey = ["dashboard"] as const;

export function userDashboardOptions() {
  return queryOptions({
    queryKey: dashboardKey,
    queryFn: ({ signal }) => fetchUserDashboard(signal),
    staleTime: 30_000,
    retry: shouldRetryQuery,
  });
}

export function useUserDashboard(enabled: boolean) {
  return useQuery({ ...userDashboardOptions(), enabled });
}

export function useSupportDashboard(enabled: boolean) {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: ({ signal }) => fetchSupportDashboard(signal),
    staleTime: 30_000,
    retry: shouldRetryQuery,
    enabled,
  });
}

export function useAdminDashboard(enabled: boolean) {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: ({ signal }) => fetchAdminDashboard(signal),
    staleTime: 30_000,
    retry: shouldRetryQuery,
    enabled,
  });
}
