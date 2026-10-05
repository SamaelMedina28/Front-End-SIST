import Link from "next/link";

import { cn } from "@/lib/utils";

export function AppLogo({ compact = false, href = "/design-system", className }: { compact?: boolean; href?: string; className?: string }) {
  return (
    <Link aria-label="Sistema Integral de Soporte Técnico FCQI" className={cn("flex items-center gap-3", className)} href={href}>
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary">UABC</span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold text-foreground">Soporte Técnico</span>
          <span className="block truncate text-xs text-muted-foreground">FCQI · UABC</span>
        </span>
      )}
    </Link>
  );
}
