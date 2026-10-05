import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function AppLogo({ compact = false, href = "/", variant = "default", className }: { compact?: boolean; href?: string; variant?: "default" | "inverse"; className?: string }) {
  return (
    <Link aria-label="Sistema Integral de Soporte Técnico FCQI" className={cn("flex items-center gap-3", className)} href={href}>
      <Image alt="" className={cn("h-14 w-auto shrink-0 object-contain", variant === "inverse" && "rounded-md")} height={645} priority src="/Logo-uabc.png" width={475} />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className={cn("block truncate text-sm font-semibold", variant === "inverse" ? "text-primary-foreground" : "text-foreground")}>Soporte Técnico</span>
          <span className={cn("block truncate text-xs", variant === "inverse" ? "text-primary-foreground/75" : "text-muted-foreground")}>FCQI · UABC</span>
        </span>
      )}
    </Link>
  );
}
