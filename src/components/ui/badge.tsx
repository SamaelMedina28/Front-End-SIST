import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "border-border bg-muted text-muted-foreground",
      info: "border-info/20 bg-info/10 text-info-foreground",
      success: "border-success/20 bg-success/10 text-success-foreground",
      warning: "border-warning/30 bg-warning/10 text-warning-foreground",
      danger: "border-danger/20 bg-danger/10 text-danger-foreground",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ tone, className }))} {...props} />;
}
