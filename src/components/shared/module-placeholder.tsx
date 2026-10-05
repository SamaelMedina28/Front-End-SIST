import { PageHeader } from "@/components/shared/page-header";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return <section className="space-y-6">
    <PageHeader title={title} description={description} />
    <div className="rounded-xl border bg-surface p-6 md:p-8">
      <p className="text-sm text-muted-foreground">Este módulo está pendiente de implementación. No se muestran datos de ejemplo.</p>
    </div>
  </section>;
}
