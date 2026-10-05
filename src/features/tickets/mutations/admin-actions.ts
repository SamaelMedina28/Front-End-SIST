"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/api-error";
import { assignTicket, changeTicketPriority, unassignTicket, type AdminAssigneeInput, type TicketPriorityInput } from "../api";
import { invalidateTicketContext } from "./invalidate-ticket-context";

export function useAdminAssignTicket(ticketId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminAssigneeInput) => assignTicket(ticketId, body),
    retry: false,
    onSuccess: () => invalidateTicketContext(client, ticketId),
    onError: (error) => error instanceof ApiError && error.status === 409
      ? invalidateTicketContext(client, ticketId)
      : undefined,
  });
}

export function useAdminUnassignTicket(ticketId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => unassignTicket(ticketId),
    retry: false,
    onSuccess: () => invalidateTicketContext(client, ticketId),
    onError: (error) => error instanceof ApiError && error.status === 409
      ? invalidateTicketContext(client, ticketId)
      : undefined,
  });
}

export function useAdminChangeTicketPriority(ticketId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: TicketPriorityInput) => changeTicketPriority(ticketId, body),
    retry: false,
    onSuccess: () => invalidateTicketContext(client, ticketId),
    onError: (error) => error instanceof ApiError && error.status === 409
      ? invalidateTicketContext(client, ticketId)
      : undefined,
  });
}
