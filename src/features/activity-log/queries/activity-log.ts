"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { shouldRetryQuery } from "@/lib/api/query-retry";
import { fetchActivityLog, fetchActivityLogHistory, fetchActivityLogParticipants, fetchActivityLogs, type ActivityLogFilters } from "../api";

export const activityLogsKey = ["activity-log"] as const;
export const activityLogListKey = (filters: ActivityLogFilters) => [...activityLogsKey, filters] as const;
export const activityLogDetailKey = (id: string) => [...activityLogsKey, id] as const;
export const activityLogHistoryKey = (id: string) => [...activityLogsKey, id, "history"] as const;
export const activityLogParticipantsKey = (ticketId: string) => [...activityLogsKey, "participants", ticketId] as const;

export function activityLogsOptions(filters: ActivityLogFilters) {
  return queryOptions({ queryKey: activityLogListKey(filters), queryFn: ({ signal }) => fetchActivityLogs(filters, signal), retry: shouldRetryQuery });
}

export function useActivityLogs(filters: ActivityLogFilters) {
  return useQuery(activityLogsOptions(filters));
}

export function useActivityLog(id: string) {
  return useQuery({ queryKey: activityLogDetailKey(id), queryFn: ({ signal }) => fetchActivityLog(id, signal), retry: shouldRetryQuery, enabled: !!id });
}

export function useActivityLogHistory(id: string, enabled: boolean) {
  return useQuery({ queryKey: activityLogHistoryKey(id), queryFn: ({ signal }) => fetchActivityLogHistory(id, signal), retry: shouldRetryQuery, enabled: !!id && enabled });
}

export function useActivityLogParticipants(ticketId: string) {
  return useQuery({ queryKey: activityLogParticipantsKey(ticketId), queryFn: ({ signal }) => fetchActivityLogParticipants(ticketId, signal), retry: shouldRetryQuery, enabled: isUuid(ticketId) });
}

function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value); }
