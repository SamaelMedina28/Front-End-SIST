import { SupportMemberEditView } from "@/features/support-members/components/support-member-edit-view";

export default async function EditSupportMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupportMemberEditView id={id} />;
}
