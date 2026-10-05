"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/api-error";
import { assignTicketToSelf, changeTicketStatus, type TicketStatusInput } from "../api";
import { invalidateTicketContext } from "./invalidate-ticket-context";

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
    onError: (error) => error instanceof ApiError && error.status === 409
      ? invalidateTicketContext(queryClient, ticketId)
      : undefined,
  });
}
