import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return <main className="mx-auto grid min-h-screen max-w-3xl content-center gap-6 px-4 py-10">
    <PageHeader title="No encontramos esta página" description="La dirección puede haber cambiado o ya no estar disponible." />
    <Link className={cn(buttonVariants({ variant: "primary" }), "w-fit")} href="/">Volver al inicio</Link>
  </main>;
}
