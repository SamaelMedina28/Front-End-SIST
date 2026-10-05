"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { shouldRetryQuery } from "@/lib/api/query-retry";
import { fetchTicketFormCatalog } from "../api";

export const ticketFormCatalogKey = ["catalog", "ticket-form"] as const;

export function ticketFormCatalogOptions() {
  return queryOptions({
    queryKey: ticketFormCatalogKey,
    queryFn: ({ signal }) => fetchTicketFormCatalog(signal),
    staleTime: 5 * 60_000,
    retry: shouldRetryQuery,
  });
}

export function useTicketFormCatalog(enabled = true) {
  return useQuery({ ...ticketFormCatalogOptions(), enabled });
}
