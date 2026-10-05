import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Cargando información" }: { label?: string }) {
  return <div aria-label={label} aria-live="polite" className="grid gap-4"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-72 max-w-full" /><Skeleton className="h-36 w-full rounded-xl" /></div>;
}

export function PageSkeleton() {
  return <div className="grid gap-6"><div className="grid gap-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-72 max-w-full" /><Skeleton className="h-5 w-[28rem] max-w-full" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-32 rounded-xl" key={index} />)}</div><Skeleton className="h-64 rounded-xl" /></div>;
}
