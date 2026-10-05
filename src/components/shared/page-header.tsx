import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({ title, description, breadcrumb, actions, className }: { title: string; description?: string; breadcrumb?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("grid gap-4 border-b pb-6 md:flex md:items-end md:justify-between", className)}>
      <div className="grid gap-2">
        {breadcrumb && <div className="text-xs font-medium text-muted-foreground">{breadcrumb}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
