"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/shared/app-logo";
import { Separator } from "@/components/ui/separator";
import { getActiveNavigation, getNavigationItems } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/api";

export function Sidebar({ role, onNavigate }: { role?: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = role ? getNavigationItems(role) : [];
  const activeHref = role ? getActiveNavigation(pathname, role) : undefined;
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-surface px-4 py-5">
      <div className="px-2"><AppLogo href="/dashboard" /></div>
      <Separator className="my-6" />
      <nav aria-label="Navegación principal" className="grid gap-1">
        {items.length > 0 && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Módulos</p>}
        {items.map(({ label, href, icon: Icon }) => {
          const active = href === activeHref;
          return <Link aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:text-foreground", active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary")} href={href} key={label} onClick={onNavigate}><Icon aria-hidden="true" size={18} />{label}</Link>;
        })}
      </nav>
      <div className="mt-auto grid gap-4 pt-6"><Separator /><p className="px-2 text-xs text-muted-foreground">FCQI · Universidad Autónoma de Baja California</p></div>
    </aside>
  );
}
