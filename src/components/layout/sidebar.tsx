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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-primary-foreground/15 bg-primary px-4 py-5 text-primary-foreground">
      <div className="rounded-xl bg-white px-2 py-2 shadow-sm"><AppLogo href="/dashboard" /></div>
      <Separator className="my-6 bg-primary-foreground/20" />
      <nav aria-label="Navegación principal" className="grid gap-1">
        {items.length > 0 && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/65">Módulos</p>}
        {items.map(({ label, href, icon: Icon }) => {
          const active = href === activeHref;
          return <Link aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:text-primary-foreground", active && "bg-warning font-semibold text-[#302000] shadow-sm hover:bg-warning hover:text-[#302000]")} href={href} key={label} onClick={onNavigate}><Icon aria-hidden="true" size={18} />{label}</Link>;
        })}
      </nav>
      <div className="mt-auto grid gap-4 pt-6"><Separator className="bg-primary-foreground/20" /><p className="px-2 text-xs text-primary-foreground/75">FCQI · Universidad Autónoma de Baja California</p></div>
    </aside>
  );
}
