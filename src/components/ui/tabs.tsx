"use client";

import { createContext, useContext, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ defaultValue, children, className }: { defaultValue: string; children: ReactNode; className?: string }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsContext.Provider value={{ value, setValue }}><div className={cn("grid gap-4", className)}>{children}</div></TabsContext.Provider>;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-1", className)} role="tablist" {...props} />;
}

export function TabsTrigger({ value, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = useContext(TabsContext);
  const active = context?.value === value;
  return (
    <button
      aria-selected={active}
      className={cn("rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", active && "bg-surface text-foreground shadow-sm", className)}
      onClick={() => context?.setValue(value)}
      role="tab"
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (context?.value !== value) return null;
  return <div className={cn("outline-none", className)} role="tabpanel">{children}</div>;
}
