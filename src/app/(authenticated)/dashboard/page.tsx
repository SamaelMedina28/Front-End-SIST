"use client";

import { useCurrentUser } from "@/features/auth/queries/current-user";
import { roleLabels } from "@/lib/constants/presentation";

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;
  return <section className="space-y-6">
    <div><p className="mb-2 text-sm font-medium text-primary">Soporte FCQI</p><h1 className="text-2xl font-semibold tracking-tight">Sesión iniciada correctamente</h1></div>
    <dl className="grid max-w-2xl gap-5 rounded-xl border bg-surface p-6">
      <div><dt className="text-sm text-muted-foreground">Nombre</dt><dd className="break-words font-medium">{user.fullName}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Correo institucional</dt><dd className="break-all">{user.email}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Rol</dt><dd>{roleLabels[user.role]}</dd></div>
    </dl>
  </section>;
}
