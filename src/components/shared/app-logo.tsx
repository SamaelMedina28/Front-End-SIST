import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function AppLogo({ compact = false, href = "/", className }: { compact?: boolean; href?: string; className?: string }) {
  return (
    <Link aria-label="Sistema Integral de Soporte Técnico FCQI" className={cn("flex items-center gap-3", className)} href={href}>
      <Image alt="" className="h-10 w-auto shrink-0 object-contain" height={645} priority src="/Logo-uabc.png" width={475} />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold text-foreground">Soporte Técnico</span>
          <span className="block truncate text-xs text-muted-foreground">FCQI · UABC</span>
        </span>
      )}
    </Link>
  );
}
