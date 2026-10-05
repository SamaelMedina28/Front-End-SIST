"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  void open;
  void onOpenChange;
  return <div>{children}</div>;
}

export function DialogContent({ open, onOpenChange, className, children, ...props }: { open: boolean; onOpenChange: (open: boolean) => void; className?: string; children: ReactNode } & Omit<HTMLAttributes<HTMLDialogElement>, "className" | "children" | "open">) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      aria-labelledby="dialog-title"
      className={cn("fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-2xl border bg-surface p-0 text-surface-foreground shadow-xl backdrop:bg-foreground/30", className)}
      onCancel={() => onOpenChange(false)}
      onClose={() => onOpenChange(false)}
      ref={ref}
      {...props}
    >
      {children}
    </dialog>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2 px-6 pb-4 pt-6", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} id="dialog-title" {...props} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end", className)} {...props} />;
}
