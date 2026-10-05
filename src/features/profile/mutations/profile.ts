"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { currentUserKey } from "@/features/auth/queries/current-user";
import { updateUserProfile, type UpdateUserProfileInput } from "../api";

export function useUpdateUserProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ["users", "me", "update"],
    mutationFn: (body: UpdateUserProfileInput) => updateUserProfile(body),
    retry: false,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: currentUserKey, exact: true });
    },
  });
}
