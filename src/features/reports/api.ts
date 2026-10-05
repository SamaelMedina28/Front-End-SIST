import { ApiError } from "@/lib/api/api-error";
import { getBrowserClient } from "@/lib/api/browser-client";
import { requestApi } from "@/lib/api/request";
import type { components, paths } from "@/types/api.generated";

export type ActivityReport = components["schemas"]["ActivityReportResponse"]["data"];
export type ActivityReportFilters = NonNullable<paths["/api/v1/reports/activity"]["get"]["parameters"]["query"]>;

export async function fetchActivityReport(filters: ActivityReportFilters, signal?: AbortSignal): Promise<ActivityReport> {
  const data = await requestApi(() => getBrowserClient().GET("/api/v1/reports/activity", { params: { query: filters }, signal }));
  if (!data || !Array.isArray(data.byCategory) || !Array.isArray(data.byTechnician) || !Array.isArray(data.daily) || !data.summary) {
    throw ApiError.unexpected();
  }
  return data;
}
