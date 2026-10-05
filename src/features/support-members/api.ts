import { ApiError } from "@/lib/api/api-error";
import { getBrowserClient } from "@/lib/api/browser-client";
import { requestApi, requestApiEnvelope } from "@/lib/api/request";
import type { components, paths } from "@/types/api.generated";

export type SupportMember = components["schemas"]["SupportMember"];
export type SupportMemberListItem = components["schemas"]["SupportMemberListItem"];
export type CreateSupportMemberRequest = components["schemas"]["CreateSupportMemberRequest"];
export type PatchSupportMemberRequest = components["schemas"]["PatchSupportMemberRequest"];
export type SupportMemberFilters = NonNullable<paths["/api/v1/support-members"]["get"]["parameters"]["query"]>;
export type SupportMemberPageMeta = components["schemas"]["PaginatedSupportMembersResponse"]["meta"];

function assertMember(data: SupportMember | undefined): SupportMember {
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}
function assertMeta(meta: unknown): SupportMemberPageMeta {
  if (!meta || typeof meta !== "object" || !("page" in meta && typeof meta.page === "number" && "pageSize" in meta && typeof meta.pageSize === "number" && "total" in meta && typeof meta.total === "number" && "totalPages" in meta && typeof meta.totalPages === "number")) throw ApiError.unexpected();
  return { page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages };
}
export async function fetchSupportMembers(filters: SupportMemberFilters, signal?: AbortSignal) {
  const response = await requestApiEnvelope<SupportMemberListItem[], SupportMemberPageMeta>(() => getBrowserClient().GET("/api/v1/support-members", { params: { query: filters }, signal }));
  return { members: response.data, meta: assertMeta(response.meta) };
}
export async function fetchSupportMember(id: string, signal?: AbortSignal) {
  return assertMember(await requestApi(() => getBrowserClient().GET("/api/v1/support-members/{id}", { params: { path: { id } }, signal })));
}
export async function createSupportMember(body: CreateSupportMemberRequest) {
  return assertMember(await requestApi(() => getBrowserClient().POST("/api/v1/support-members", { body })));
}
export async function patchSupportMember(id: string, body: PatchSupportMemberRequest) {
  return assertMember(await requestApi(() => getBrowserClient().PATCH("/api/v1/support-members/{id}", { params: { path: { id } }, body })));
}
export async function deactivateSupportMember(id: string) {
  await requestApi(() => getBrowserClient().DELETE("/api/v1/support-members/{id}", { params: { path: { id } } }));
}
