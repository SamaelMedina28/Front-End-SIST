"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchCurrentUser, type CurrentUser } from "../api";
import { shouldRetryQuery } from "@/lib/api/query-retry";

export const currentUserKey = ["auth", "me"] as const;

export function currentUserOptions() {
  return queryOptions({
    queryKey: currentUserKey,
    queryFn: ({ signal }): Promise<CurrentUser | null> => fetchCurrentUser(signal),
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: shouldRetryQuery,
  });
}

export function useCurrentUser() {
  return useQuery(currentUserOptions());
}
