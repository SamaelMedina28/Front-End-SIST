import { TicketListView } from "@/features/tickets/components/ticket-list-view";
import { parseTicketFilters, ticketFilterEntries } from "@/features/tickets/utils/ticket-filters";

export default async function TicketsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseTicketFilters(await searchParams);
  return <TicketListView filters={filters} key={ticketFilterEntries(filters)} />;
}
