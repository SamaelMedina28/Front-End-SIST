import { Menu, MoreHorizontal } from "lucide-react";

import { AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-[72px] items-center justify-between border-b bg-surface px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3"><Button aria-label="Abrir navegación" className="md:hidden" onClick={onMenuClick} size="icon" variant="ghost"><Menu aria-hidden="true" size={20} /></Button><div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><span>Desarrollo</span><span aria-hidden="true">/</span><span className="font-medium text-foreground">Design System</span></div><span className="rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-warning-foreground sm:hidden">DEV</span></div>
      <div className="flex items-center gap-2"><Button aria-label="Más acciones (pendiente)" disabled size="icon" variant="ghost"><MoreHorizontal aria-hidden="true" size={20} /></Button><div className="hidden text-right sm:block"><p className="text-sm font-medium">Usuario placeholder</p><p className="text-xs text-muted-foreground">Rol pendiente</p></div><AvatarFallback>DS</AvatarFallback></div>
    </header>
  );
}
