import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ title, value, description, icon: Icon, trend }: { title: string; value: string; description: string; icon: LucideIcon; trend?: string }) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-start justify-between gap-3"><div className="grid gap-1"><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-semibold tracking-tight">{value}</p></div><span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon aria-hidden="true" size={20} /></span></div>
        <p className="text-xs text-muted-foreground">{trend && <span className="mr-1 font-medium text-success-foreground">{trend}</span>}{description}</p>
      </CardContent>
    </Card>
  );
}
