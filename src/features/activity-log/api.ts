import { ApiError } from "@/lib/api/api-error";
import { getBrowserClient } from "@/lib/api/browser-client";
import { requestApi, requestApiEnvelope } from "@/lib/api/request";
import type { components, paths } from "@/types/api.generated";

export type ActivityLog = components["schemas"]["ActivityLogListItem"];
export type ActivityLogDetail = components["schemas"]["ActivityLogDetail"];
export type ActivityLogRevision = components["schemas"]["ActivityLogRevision"];
export type ActivityLogStatus = components["schemas"]["ActivityLogListItem"]["status"];
export type ActivityLogPatchRequest = components["schemas"]["ActivityLogPatchRequest"];
export type ActivityLogFilters = NonNullable<paths["/api/v1/activity-log"]["get"]["parameters"]["query"]>;
export type ActivityLogPageMeta = components["schemas"]["PaginatedActivityLogsResponse"]["meta"];

export async function fetchActivityLogs(filters: ActivityLogFilters, signal?: AbortSignal) {
  const envelope = await requestApiEnvelope<ActivityLog[], ActivityLogPageMeta>(() => getBrowserClient().GET("/api/v1/activity-log", {
    params: { query: filters }, signal,
  }));
  const meta = envelope.meta;
  if (!meta || typeof meta !== "object" || !("page" in meta && typeof meta.page === "number"
    && "pageSize" in meta && typeof meta.pageSize === "number"
    && "total" in meta && typeof meta.total === "number"
    && "totalPages" in meta && typeof meta.totalPages === "number")) throw ApiError.unexpected();
  return { entries: envelope.data, meta: { page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages } };
}

export async function fetchActivityLog(id: string, signal?: AbortSignal): Promise<ActivityLogDetail> {
  const data = await requestApi(() => getBrowserClient().GET("/api/v1/activity-log/{id}", { params: { path: { id } }, signal }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}

export async function fetchActivityLogHistory(id: string, signal?: AbortSignal): Promise<ActivityLogRevision[]> {
  const data = await requestApi(() => getBrowserClient().GET("/api/v1/activity-log/{id}/history", { params: { path: { id } }, signal }));
  if (!Array.isArray(data)) throw ApiError.unexpected();
  return data;
}

export async function updateActivityLog(id: string, body: ActivityLogPatchRequest): Promise<ActivityLogDetail> {
  const data = await requestApi(() => getBrowserClient().PATCH("/api/v1/activity-log/{id}", { params: { path: { id } }, body }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}
