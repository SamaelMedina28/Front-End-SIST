"use client";

import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/queries/current-user";
import { cn } from "@/lib/utils";
import { ActivityLogCreateBlock } from "./activity-log-form";

export function ActivityLogCreatePage({ ticketId }: { ticketId?: string }) {
  const { data: user } = useCurrentUser();
  if (user?.role !== "SUB_MANAGER") return <section className="grid gap-5"><PageHeader title="Registrar actividad" /><p className="text-sm">La creación de bitácora está disponible únicamente para SUB_MANAGER.</p><Link className={cn(buttonVariants({ variant: "outline" }))} href="/activity-log">Volver a bitácora</Link></section>;
  return <section className="grid gap-5"><PageHeader title="Registrar actividad" description="Vincula la actividad con un ticket existente." /><ActivityLogCreateBlock ticketId={ticketId} /></section>;
}
