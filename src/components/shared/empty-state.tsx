import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, action, icon: Icon = Inbox }: { title: string; description: string; action?: ReactNode; icon?: typeof Inbox }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-xl border border-dashed bg-surface p-8 text-center">
      <div className="grid justify-items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"><Icon aria-hidden="true" size={20} /></span>
        <div className="grid gap-1"><h3 className="font-semibold">{title}</h3><p className="max-w-md text-sm text-muted-foreground">{description}</p></div>
        {action}
      </div>
    </div>
  );
}

export function EmptyStateAction({ children, ...props }: React.ComponentProps<typeof Button>) {
  return <Button size="sm" {...props}>{children}</Button>;
}
