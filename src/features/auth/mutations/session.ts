"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { completeProfile, logout } from "../api";
import { currentUserKey } from "../queries/current-user";

export async function clearSessionCache(client: QueryClient) {
  // Cancel before removal so an old response cannot repopulate private caches.
  await client.cancelQueries();
  client.removeQueries({ predicate: (query) => query.queryKey.length !== 2 || query.queryKey[0] !== "auth" || query.queryKey[1] !== "me" });
  client.setQueryData(currentUserKey, null);
  client.getMutationCache().clear();
}

export function useLogout() {
  const client = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: logout,
    retry: false,
    onSuccess: async () => {
      await clearSessionCache(client);
      router.replace("/login");
    },
  });
}

export function useCompleteProfile() {
  const client = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationKey: ["auth", "complete-profile"],
    mutationFn: completeProfile,
    retry: false,
    onSuccess: async () => {
      await client.cancelQueries({ queryKey: currentUserKey, exact: true });
      await client.invalidateQueries({ queryKey: currentUserKey, exact: true, refetchType: "none" });
      // Confirm with a fresh /me on this route. A failed GET never repeats the POST.
      router.replace("/auth/success");
    },
  });
}
