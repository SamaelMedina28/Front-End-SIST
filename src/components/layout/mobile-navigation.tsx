"use client";

import { X } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function MobileNavigation({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetHeader><SheetTitle>Navegación</SheetTitle><Button aria-label="Cerrar navegación" onClick={() => onOpenChange(false)} size="icon" variant="ghost"><X aria-hidden="true" size={18} /></Button></SheetHeader><div className="flex-1"><Sidebar onNavigate={() => onOpenChange(false)} /></div></Sheet>;
}
