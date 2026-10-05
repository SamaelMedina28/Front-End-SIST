"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { shouldRetryQuery } from "@/lib/api/query-retry";
import { fetchTicket, fetchTicketEvents, fetchTickets, type TicketFilters } from "../api";

export const ticketsKey = ["tickets"] as const;
export const ticketListKey = (filters: TicketFilters) => [...ticketsKey, filters] as const;
export const ticketDetailKey = (ticketId: string) => [...ticketsKey, ticketId] as const;
export const ticketEventsKey = (ticketId: string) => [...ticketsKey, ticketId, "events"] as const;

export function ticketsOptions(filters: TicketFilters) {
  return queryOptions({
    queryKey: ticketListKey(filters),
    queryFn: ({ signal }) => fetchTickets(filters, signal),
    staleTime: 15_000,
    retry: shouldRetryQuery,
  });
}

export function useTickets(filters: TicketFilters, enabled: boolean) {
  return useQuery({ ...ticketsOptions(filters), enabled });
}

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ticketDetailKey(ticketId),
    queryFn: ({ signal }) => fetchTicket(ticketId, signal),
    staleTime: 15_000,
    retry: shouldRetryQuery,
    enabled: ticketId.length > 0,
  });
}

export function useTicketEvents(ticketId: string, enabled: boolean) {
  return useQuery({
    queryKey: ticketEventsKey(ticketId),
    queryFn: ({ signal }) => fetchTicketEvents(ticketId, signal),
    staleTime: 15_000,
    retry: shouldRetryQuery,
    enabled,
  });
}
