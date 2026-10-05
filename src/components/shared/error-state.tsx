import { CircleAlert, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function ErrorState({ title = "No se pudo cargar la información", message, requestId, onRetry, action }: { title?: string; message: string; requestId?: string; onRetry?: () => void; action?: ReactNode }) {
  return (
    <div aria-live="polite" className="grid min-h-52 place-items-center rounded-xl border border-danger/20 bg-danger/5 p-8 text-center">
      <div className="grid justify-items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-danger/10 text-danger-foreground"><CircleAlert aria-hidden="true" size={20} /></span>
        <div className="grid gap-1"><h3 className="font-semibold">{title}</h3><p className="max-w-md text-sm text-muted-foreground">{message}</p>{requestId && <p className="font-mono text-xs text-muted-foreground">Solicitud: {requestId}</p>}</div>
        {action ?? (onRetry && <Button onClick={onRetry} size="sm" variant="outline"><RotateCcw aria-hidden="true" size={16} />Reintentar</Button>)}
      </div>
    </div>
  );
}
