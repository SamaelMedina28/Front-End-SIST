"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { shouldRetryQuery } from "@/lib/api/query-retry";
import { fetchAdminDashboard, fetchSupportDashboard, fetchUserDashboard } from "../api";

export const dashboardKey = ["dashboard"] as const;
export const userDashboardKey = [...dashboardKey, "user"] as const;
export const supportDashboardKey = [...dashboardKey, "support"] as const;
export const adminDashboardKey = [...dashboardKey, "admin"] as const;

export function userDashboardOptions() {
  return queryOptions({
    queryKey: userDashboardKey,
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
    queryKey: supportDashboardKey,
    queryFn: ({ signal }) => fetchSupportDashboard(signal),
    staleTime: 30_000,
    retry: shouldRetryQuery,
    enabled,
  });
}

export function useAdminDashboard(enabled: boolean) {
  return useQuery({
    queryKey: adminDashboardKey,
    queryFn: ({ signal }) => fetchAdminDashboard(signal),
    staleTime: 30_000,
    retry: shouldRetryQuery,
    enabled,
  });
}
