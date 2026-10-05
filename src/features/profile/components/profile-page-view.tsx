"use client";

import { useCurrentUser } from "@/features/auth/queries/current-user";
import { PageSkeleton } from "@/components/shared/loading-state";
import { ProfileForm } from "./profile-form";

export function ProfilePageView() {
  const { data: user } = useCurrentUser();
  if (!user) return <PageSkeleton />;
  return <ProfileForm user={user} />;
}
