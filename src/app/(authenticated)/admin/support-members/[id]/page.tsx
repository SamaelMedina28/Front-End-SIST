import { SupportMemberDetail } from "@/features/support-members/components/support-member-detail";

export default async function SupportMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupportMemberDetail id={id} />;
}
