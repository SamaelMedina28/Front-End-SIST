"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { assignTicketToSelf, changeTicketStatus, type TicketStatusInput } from "../api";
import { dashboardKey } from "../queries/dashboard";
import { ticketDetailKey, ticketEventsKey, ticketsKey } from "../queries/tickets";

function invalidateTicketContext(queryClient: ReturnType<typeof useQueryClient>, ticketId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ticketsKey }),
    queryClient.invalidateQueries({ queryKey: ticketDetailKey(ticketId) }),
    queryClient.invalidateQueries({ queryKey: ticketEventsKey(ticketId) }),
    queryClient.invalidateQueries({ queryKey: dashboardKey }),
  ]);
}

export function useAssignTicketToSelf(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => assignTicketToSelf(ticketId),
    retry: false,
    onSuccess: () => invalidateTicketContext(queryClient, ticketId),
  });
}

export function useChangeTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: TicketStatusInput; idempotencyKey: string }) =>
      changeTicketStatus(ticketId, body, idempotencyKey),
    retry: false,
    onSuccess: () => invalidateTicketContext(queryClient, ticketId),
  });
}
