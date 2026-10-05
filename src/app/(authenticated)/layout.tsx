import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/session-gate";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <RoleGuard>{children}</RoleGuard>;
}
