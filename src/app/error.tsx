"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto grid min-h-screen max-w-3xl content-center gap-6 px-4 py-10">
    <h1 className="text-2xl font-semibold">No se pudo mostrar esta página</h1>
    <ErrorState message="Ocurrió un problema inesperado. Intenta cargar la vista de nuevo." onRetry={reset} />
  </main>;
}
