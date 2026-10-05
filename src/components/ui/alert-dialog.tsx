"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AlertDialog({ open, onOpenChange, title, description, children, confirmLabel = "Confirmar", cancelLabel = "Cancelar", pending = false, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: ReactNode; children?: ReactNode; confirmLabel?: string; cancelLabel?: string; pending?: boolean; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          {children}
        </DialogHeader>
        <DialogFooter>
          <Button disabled={pending} onClick={() => onOpenChange(false)} variant="outline">{cancelLabel}</Button>
          <Button disabled={pending} onClick={onConfirm} variant="danger">{pending ? "Procesando…" : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
