import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ForbiddenPage() {
  return <main className="grid min-h-svh place-items-center p-6"><div className="max-w-md space-y-5 text-center"><h1 className="text-2xl font-semibold">Acceso restringido</h1><p>No tienes permisos para acceder a esta sección.</p><Link className={buttonVariants({ variant: "outline" })} href="/dashboard">Volver al inicio</Link></div></main>;
}
