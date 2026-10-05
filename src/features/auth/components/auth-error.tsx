import Link from "next/link";

import { ErrorState } from "@/components/shared/error-state";
import { buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";

export function AuthError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = error instanceof ApiError ? error : undefined;
  const onboardingExpired = apiError?.code === "ONBOARDING_REQUIRED" || apiError?.code === "ONBOARDING_EXPIRED";
  const message = onboardingExpired
    ? "La sesión para completar tu registro ya no es válida. Inicia sesión nuevamente."
    : apiError?.message ?? "No pudimos verificar tu sesión. Inténtalo de nuevo.";

  return <ErrorState message={message} requestId={apiError?.requestId} onRetry={onRetry}
    action={onboardingExpired ? <Link className={buttonVariants({ variant: "outline" })} href="/login">Volver a iniciar sesión</Link> : undefined} />;
}
