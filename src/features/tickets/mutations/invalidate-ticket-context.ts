import type { QueryClient } from "@tanstack/react-query";

import { dashboardKey } from "../queries/dashboard";
import { ticketDetailKey, ticketEventsKey, ticketsKey } from "../queries/tickets";

export function invalidateTicketContext(queryClient: QueryClient, ticketId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ticketsKey }),
    queryClient.invalidateQueries({ queryKey: ticketDetailKey(ticketId) }),
    queryClient.invalidateQueries({ queryKey: ticketEventsKey(ticketId) }),
    queryClient.invalidateQueries({ queryKey: dashboardKey }),
  ]);
}
