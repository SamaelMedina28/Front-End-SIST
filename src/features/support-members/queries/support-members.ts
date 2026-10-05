"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { shouldRetryQuery } from "@/lib/api/query-retry";
import { fetchSupportMember, fetchSupportMembers, type SupportMemberFilters } from "../api";

export const supportMembersKey = ["support-members"] as const;
export const supportMemberListKey = (filters: SupportMemberFilters) => [...supportMembersKey, "list", filters] as const;
export const supportMemberDetailKey = (id: string) => [...supportMembersKey, "detail", id] as const;
export function useSupportMembers(filters: SupportMemberFilters, enabled = true) { return useQuery(queryOptions({ queryKey: supportMemberListKey(filters), queryFn: ({ signal }) => fetchSupportMembers(filters, signal), retry: shouldRetryQuery, enabled })); }
export function useSupportMember(id: string) { return useQuery(queryOptions({ queryKey: supportMemberDetailKey(id), queryFn: ({ signal }) => fetchSupportMember(id, signal), retry: shouldRetryQuery, enabled: !!id })); }
