"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { createSupportMember, deactivateSupportMember, patchSupportMember, type CreateSupportMemberRequest, type PatchSupportMemberRequest } from "../api";
import { supportMemberDetailKey, supportMembersKey } from "../queries/support-members";

export function useCreateSupportMember() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: CreateSupportMemberRequest) => createSupportMember(body), retry: false, onSuccess: () => client.invalidateQueries({ queryKey: supportMembersKey }) });
}
export function usePatchSupportMember(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (body: PatchSupportMemberRequest) => patchSupportMember(id, body), retry: false, onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: supportMembersKey }), client.invalidateQueries({ queryKey: supportMemberDetailKey(id) })]) });
}
export function useDeactivateSupportMember(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: () => deactivateSupportMember(id), retry: false,
    onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: supportMembersKey }), client.invalidateQueries({ queryKey: supportMemberDetailKey(id) })]),
    onError: (error) => error instanceof ApiError && error.status === 409 ? Promise.all([client.invalidateQueries({ queryKey: supportMembersKey }), client.invalidateQueries({ queryKey: supportMemberDetailKey(id) })]) : undefined,
  });
}
