import { ActivityLogCreatePage } from "@/features/activity-log/components/activity-log-create-page";

export default async function NewActivityLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const ticketId = Array.isArray(params.ticketId) ? params.ticketId[0] : params.ticketId;
  return <ActivityLogCreatePage ticketId={ticketId} />;
}
