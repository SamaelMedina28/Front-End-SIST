"use client";

import { useCurrentUser } from "@/features/auth/queries/current-user";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { PageSkeleton } from "@/components/shared/loading-state";
import { ProfileForm } from "./profile-form";

export function ProfilePageView() {
  const { data: user } = useCurrentUser();
  if (!user) return <PageSkeleton />;
  if (user.role !== "USER") return <ModulePlaceholder title="Mi perfil" description="Esta vista se implementará en la siguiente etapa." />;
  return <ProfileForm user={user} />;
}
