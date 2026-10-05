import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex size-10 items-center justify-center overflow-hidden rounded-full border bg-muted", className)} {...props} />;
}

export function AvatarFallback({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("inline-flex size-10 items-center justify-center rounded-full border bg-secondary text-sm font-semibold text-secondary-foreground", className)} {...props}>
      {children}
    </span>
  );
}
