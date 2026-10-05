import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ForbiddenPage() {
  return <main className="grid min-h-svh place-items-center bg-background p-6">
    <div className="w-full max-w-md space-y-8 rounded-2xl border bg-surface p-7 text-center shadow-sm sm:p-10">
      <div className="flex justify-center"><AppLogo href="/dashboard" /></div>
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground"><LockKeyhole aria-hidden="true" size={24} /></div>
      <div className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight">Acceso restringido</h1><p className="text-sm leading-6 text-muted-foreground">Tu rol actual no permite acceder a esta sección. Si consideras que es un error, contacta al administrador del sistema.</p></div>
      <Link className={cn(buttonVariants({ variant: "primary" }), "w-full")} href="/dashboard">Volver al inicio</Link>
    </div>
  </main>;
}
