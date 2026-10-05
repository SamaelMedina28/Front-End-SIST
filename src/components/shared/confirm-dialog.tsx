"use client";

import type { ReactNode } from "react";

import { AlertDialog } from "@/components/ui/alert-dialog";

export function ConfirmDialog({ open, onOpenChange, title = "¿Confirmar acción?", description, children, confirmLabel = "Confirmar", pending = false, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; title?: string; description: ReactNode; children?: ReactNode; confirmLabel?: string; pending?: boolean; onConfirm: () => void }) {
  return <AlertDialog confirmLabel={confirmLabel} description={description} onConfirm={onConfirm} onOpenChange={onOpenChange} open={open} pending={pending} title={title}>{children}</AlertDialog>;
}
