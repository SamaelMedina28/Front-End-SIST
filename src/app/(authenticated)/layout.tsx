import type { ReactNode } from "react";
import { AuthGuard } from "@/features/auth/components/session-gate";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
