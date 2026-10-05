import Link from "next/link";

import { LogOut } from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { navigationItems } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({ activeHref = "/design-system", onNavigate }: { activeHref?: string; onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-surface px-4 py-5">
      <div className="px-2"><AppLogo /></div>
      <Separator className="my-6" />
      <nav aria-label="Navegación principal" className="grid gap-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Módulos</p>
        {navigationItems.map(({ label, href, icon: Icon }) => {
          const active = href === activeHref;
          return <Link aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:text-foreground", active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary")} href={href} key={label} onClick={onNavigate}><Icon aria-hidden="true" size={18} />{label}</Link>;
        })}
      </nav>
      <div className="mt-auto grid gap-4 pt-6"><Separator /><div className="flex items-center gap-3 px-2"><AvatarFallback>DS</AvatarFallback><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Usuario placeholder</p><p className="truncate text-xs text-muted-foreground">Rol pendiente</p></div><button aria-label="Cerrar sesión (pendiente)" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" disabled type="button"><LogOut aria-hidden="true" size={16} /></button></div></div>
    </aside>
  );
}
