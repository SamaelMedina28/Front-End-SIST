"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Sheet({ open, onOpenChange, side = "left", children }: { open: boolean; onOpenChange: (open: boolean) => void; side?: "left" | "right"; children: ReactNode }) {
  if (!open) return null;
  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex" role="dialog">
      <button aria-label="Cerrar navegación" className="absolute inset-0 cursor-default bg-foreground/30" onClick={() => onOpenChange(false)} type="button" />
      <aside className={cn("relative z-10 flex h-full w-[min(20rem,calc(100%-3rem))] flex-col bg-surface shadow-xl", side === "right" && "ml-auto")}>{children}</aside>
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between border-b p-4", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold", className)} {...props} />;
}

export function SheetContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto p-4", className)} {...props} />;
}
