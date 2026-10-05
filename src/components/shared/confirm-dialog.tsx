"use client";

import type { ReactNode } from "react";

import { AlertDialog } from "@/components/ui/alert-dialog";

export function ConfirmDialog({ open, onOpenChange, title = "¿Confirmar acción?", description, confirmLabel = "Confirmar", onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; title?: string; description: ReactNode; confirmLabel?: string; onConfirm: () => void }) {
  return <AlertDialog confirmLabel={confirmLabel} description={description} onConfirm={onConfirm} onOpenChange={onOpenChange} open={open} title={title} />;
}
