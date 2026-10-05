import type { ReactNode } from "react";

import { AppLogo } from "@/components/shared/app-logo";

export function AuthFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
    <section className="w-full max-w-md rounded-2xl border border-t-4 border-t-primary bg-surface p-6 shadow-sm sm:p-8">
      <AppLogo href="/login" />
      <div className="mb-7 mt-8 space-y-2"><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="text-sm leading-relaxed text-muted-foreground">{description}</p></div>
      {children}
      <p className="mt-8 border-t pt-4 text-xs text-muted-foreground">Facultad de Ciencias Químicas e Ingeniería · UABC</p>
    </section>
  </main>;
}
