import { InventoryEditView } from "@/features/inventory/components/inventory-edit-view";

export default async function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InventoryEditView id={id} />;
}
