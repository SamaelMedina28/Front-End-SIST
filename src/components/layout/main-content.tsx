import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function MainContent({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <main className={cn("min-w-0 flex-1 px-4 py-6 md:px-6 md:py-8 xl:px-10", className)} {...props} />;
}
