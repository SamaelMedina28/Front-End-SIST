"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AlertDialog({ open, onOpenChange, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: ReactNode; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">{cancelLabel}</Button>
          <Button onClick={onConfirm} variant="danger">{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
