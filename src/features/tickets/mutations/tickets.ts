"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTicket, type CreateTicketRequest } from "../api";
import { dashboardKey } from "../queries/dashboard";
import { ticketsKey } from "../queries/tickets";

export function useCreateTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["tickets", "create"],
    mutationFn: (body: CreateTicketRequest) => createTicket(body),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ticketsKey }),
        client.invalidateQueries({ queryKey: dashboardKey, exact: true }),
      ]);
    },
  });
}
