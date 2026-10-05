import { ApiError } from "@/lib/api/api-error";
import { getBrowserClient } from "@/lib/api/browser-client";
import { requestApi, requestApiEnvelope } from "@/lib/api/request";
import type { components, paths } from "@/types/api.generated";

export type Ticket = components["schemas"]["TicketListItem"];
export type TicketDetail = components["schemas"]["TicketDetail"];
export type TicketEvent = components["schemas"]["TicketEvent"];
export type TicketFormCatalog = components["schemas"]["TicketFormCatalog"];
export type TicketFormCategory = components["schemas"]["TicketFormCategory"];
export type CreateTicketRequest = components["schemas"]["CreateTicketRequest"];
export type CreatedTicket = Pick<components["schemas"]["CreatedTicket"], "id">;
export type TicketFilters = NonNullable<paths["/api/v1/tickets"]["get"]["parameters"]["query"]>;
export type TicketPageMeta = components["schemas"]["PaginatedTicketsResponse"]["meta"];
export type UserDashboard = components["schemas"]["UserDashboardResponse"]["data"];
export type SupportDashboard = components["schemas"]["SupportDashboardResponse"]["data"];
export type AdminDashboard = components["schemas"]["AdminDashboardResponse"]["data"];
export type SupportArea = components["schemas"]["Category"]["supportArea"];
export type TicketStatusInput = components["schemas"]["TicketStatusInput"];
export type TicketStatus = TicketStatusInput["status"];
export type TicketPriority = components["schemas"]["TicketPriorityInput"]["priority"];
export type TicketPriorityInput = components["schemas"]["TicketPriorityInput"];
export type AdminAssigneeInput = components["schemas"]["AdminAssigneeInput"];
type DashboardResponseData = UserDashboard
  | SupportDashboard
  | components["schemas"]["AdminDashboardResponse"]["data"];

export async function fetchUserDashboard(signal?: AbortSignal): Promise<UserDashboard> {
  const data = await requestApi<DashboardResponseData>(() => getBrowserClient().GET("/api/v1/dashboard", { signal }));
  if (!data || !("recentTickets" in data)) throw ApiError.unexpected();
  return data;
}

export async function fetchSupportDashboard(signal?: AbortSignal): Promise<SupportDashboard> {
  const data = await requestApi<DashboardResponseData>(() => getBrowserClient().GET("/api/v1/dashboard", { signal }));
  if (!data || !("priorityTickets" in data)) throw ApiError.unexpected();
  return data;
}

export async function fetchAdminDashboard(signal?: AbortSignal): Promise<AdminDashboard> {
  const data = await requestApi<DashboardResponseData>(() => getBrowserClient().GET("/api/v1/dashboard", { signal }));
  if (!data || !("technicianWorkload" in data) || !("stats" in data)) throw ApiError.unexpected();
  return data;
}

export async function assignTicketToSelf(ticketId: string) {
  const data = await requestApi(() => getBrowserClient().POST("/api/v1/tickets/{id}/assign-self", {
    params: { path: { id: ticketId } },
    body: {},
  }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}

export async function changeTicketStatus(ticketId: string, body: TicketStatusInput, idempotencyKey: string) {
  const data = await requestApi(() => getBrowserClient().PATCH("/api/v1/tickets/{id}/status", {
    params: { path: { id: ticketId } },
    headers: { "Idempotency-Key": idempotencyKey },
    body,
  }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}

export async function assignTicket(ticketId: string, body: AdminAssigneeInput) {
  const data = await requestApi(() => getBrowserClient().PUT("/api/v1/tickets/{id}/assignee", {
    params: { path: { id: ticketId } },
    body,
  }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}

export async function unassignTicket(ticketId: string) {
  await requestApi(() => getBrowserClient().DELETE("/api/v1/tickets/{id}/assignee", {
    params: { path: { id: ticketId } },
  }));
}

export async function changeTicketPriority(ticketId: string, body: TicketPriorityInput) {
  const data = await requestApi(() => getBrowserClient().PATCH("/api/v1/tickets/{id}/priority", {
    params: { path: { id: ticketId } },
    body,
  }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}

export async function fetchTickets(filters: TicketFilters, signal?: AbortSignal) {
  const envelope = await requestApiEnvelope<Ticket[], TicketPageMeta>(() => getBrowserClient().GET("/api/v1/tickets", {
    params: { query: filters },
    signal,
  }));
  const meta = envelope.meta;
  if (!meta || typeof meta !== "object" || !(
    "page" in meta && typeof meta.page === "number"
    && "pageSize" in meta && typeof meta.pageSize === "number"
    && "total" in meta && typeof meta.total === "number"
    && "totalPages" in meta && typeof meta.totalPages === "number"
  )) {
    throw ApiError.unexpected();
  }
  const pageMeta: TicketPageMeta = { page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages };
  return { tickets: envelope.data, meta: pageMeta };
}

export async function fetchTicket(ticketId: string, signal?: AbortSignal): Promise<TicketDetail> {
  const data = await requestApi(() => getBrowserClient().GET("/api/v1/tickets/{id}", {
    params: { path: { id: ticketId } },
    signal,
  }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}

export async function fetchTicketEvents(ticketId: string, signal?: AbortSignal): Promise<TicketEvent[]> {
  const data = await requestApi(() => getBrowserClient().GET("/api/v1/tickets/{id}/events", {
    params: { path: { id: ticketId } },
    signal,
  }));
  if (!data) throw ApiError.unexpected();
  return data;
}

export async function fetchTicketFormCatalog(signal?: AbortSignal): Promise<TicketFormCatalog> {
  const data = await requestApi(() => getBrowserClient().GET("/api/v1/catalog/ticket-form", { signal }));
  if (!data) throw ApiError.unexpected();
  return data;
}

export async function createTicket(body: CreateTicketRequest): Promise<CreatedTicket> {
  const data = await requestApi(() => getBrowserClient().POST("/api/v1/tickets", { body }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return { id: data.id };
}
