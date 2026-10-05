import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function RadioGroup({ className, children, ...props }: { className?: string; children: ReactNode } & Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, "className" | "children">) {
  return (
    <fieldset className={cn("grid gap-3", className)} {...props}>
      {children}
    </fieldset>
  );
}

export function RadioGroupItem({ className, type = "radio", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring/30", className)} type={type} {...props} />;
}
