import Link from "next/link";

export default function HomePage() {
  return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="grid max-w-md gap-4 text-center"><p className="text-xs font-semibold uppercase tracking-wider text-primary">FCQI · UABC</p><h1 className="text-2xl font-semibold tracking-tight">Base visual preparada</h1><p className="text-muted-foreground">El showcase temporal del design system está disponible para revisión.</p><Link className="mx-auto inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90" href="/design-system">Abrir Design System</Link></div></main>;
}
