import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Checkbox({ className, type = "checkbox", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("size-4 rounded border-input accent-primary focus-visible:ring-2 focus-visible:ring-ring/30", className)}
      type={type}
      {...props}
    />
  );
}
