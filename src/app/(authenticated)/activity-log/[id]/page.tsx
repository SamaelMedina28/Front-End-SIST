import { ActivityLogDetail } from "@/features/activity-log/components/activity-log-detail";

export default async function ActivityLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ActivityLogDetail id={id} />;
}
