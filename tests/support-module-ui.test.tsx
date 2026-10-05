// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { SupportDashboardContent } from "../src/features/tickets/components/support-dashboard";
import { TicketListExperience } from "../src/features/tickets/components/ticket-list-view";
import { TicketDetailView } from "../src/features/tickets/components/ticket-detail-view";
import { SupportTicketActions } from "../src/features/tickets/components/support-ticket-actions";
import { currentUserKey } from "../src/features/auth/queries/current-user";
import { dashboardKey } from "../src/features/tickets/queries/dashboard";
import { ticketDetailKey, ticketEventsKey, ticketListKey } from "../src/features/tickets/queries/tickets";
import { isSupportArea } from "../src/features/tickets/utils/support-area";
import type { CurrentUser } from "../src/features/auth/api";
import type { TicketDetail, TicketEvent } from "../src/features/tickets/api";
import { jsonResponse, errorResponse, testUser } from "./auth-fixture";

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }), usePathname: () => "/tickets" }));

type Handler = (request: Request) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
const requests: Request[] = [];
const NativeAbortController = transferableAbortController().constructor;
const clients: QueryClient[] = [];
const nativeShowModal = HTMLDialogElement.prototype.showModal;
const nativeClose = HTMLDialogElement.prototype.close;

const ticketId = "44444444-4444-4444-8444-444444444444";
const categoryId = "11111111-1111-4111-8111-111111111111";
const supportUser: CurrentUser = {
  ...testUser,
  id: "77777777-7777-4777-8777-777777777777",
  role: "SUPPORT",
  supportAreas: ["HARDWARE", "NETWORKS"],
};

const ticket = {
  id: ticketId,
  code: "TK-2026-0024",
  title: "Proyector sin señal",
  category: { id: "11111111-1111-4111-8111-111111111111", name: "Equipo" },
  subcategory: null,
  location: { building: "Edificio 6", room: "603" },
  priority: "HIGH" as const,
  status: "OPEN" as const,
  assignee: null,
  createdAt: "2026-10-01T12:00:00.000Z",
};

const detail: TicketDetail = {
  id: ticketId,
  code: ticket.code,
  title: ticket.title,
  description: "No muestra imagen.",
  reporter: { fullName: "Persona solicitante" },
  category: { id: ticket.category.id, name: "Equipo", supportArea: "HARDWARE" },
  subcategory: null,
  location: { building: "Edificio 6", room: "603" },
  priority: "HIGH",
  status: "OPEN",
  assignee: null,
  inventoryItem: null,
  software: null,
  createdAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-01T12:00:00.000Z",
  assignedAt: null,
  completedAt: null,
  cancelledAt: null,
};

const ticketFormCatalog = {
  maxActiveTickets: 10 as const,
  categories: [{ id: categoryId, code: "EQUIP", name: "Equipo", supportArea: "HARDWARE" as const, defaultPriority: "MEDIUM" as const, requiresSoftwareDetails: false, subcategories: [] }],
};

function endpoint(method: string, path: string, handler: Handler) {
  handlers.set(`${method} ${path}`, handler);
}

function success(data: unknown, status = 200, meta?: unknown) {
  return jsonResponse({ success: true, data, ...(meta ? { meta } : {}) }, status);
}

function renderWithClient(children: ReactNode, user: CurrentUser = supportUser) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } });
  clients.push(client);
  client.setQueryData(currentUserKey, user);
  return { ...render(<QueryClientProvider client={client}>{children}</QueryClientProvider>), client };
}

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); } });
  push.mockReset();
  replace.mockReset();
  handlers.clear();
  endpoint("GET", "/api/v1/auth/me", () => success(supportUser));
  requests.splice(0);
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    const url = new URL(request.url);
    const handler = handlers.get(`${request.method} ${url.pathname}`);
    if (!handler) throw new Error(`Solicitud de API de prueba no configurada: ${request.method} ${url.pathname}`);
    return handler(request);
  }));
  vi.stubGlobal("AbortController", NativeAbortController);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api/v1");
  vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000");
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: nativeShowModal });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: nativeClose });
});

describe("SUPPORT dashboard", () => {
  it("uses the exact support metrics and priority queue from the dashboard response", async () => {
    endpoint("GET", "/api/v1/dashboard", () => success({
      stats: { unassigned: 2, mine: 4, highPriority: 1, completedToday: 3 },
      priorityTickets: [ticket],
    }));
    renderWithClient(<SupportDashboardContent />);
    expect(await screen.findByText("Panel de soporte")).toBeTruthy();
    expect(screen.getByText("Asignados a mí")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Hardware")).toBeTruthy();
    expect(screen.getAllByText("TK-2026-0024")).toHaveLength(2);
    expect(new URL(requests[0].url).pathname).toBe("/api/v1/dashboard");
  });

  it("renders the support empty queue, loading skeleton, and backend error", async () => {
    let resolveDashboard: ((response: Response) => void) | undefined;
    endpoint("GET", "/api/v1/dashboard", () => new Promise<Response>((resolve) => { resolveDashboard = resolve; }));
    const view = renderWithClient(<SupportDashboardContent />);
    expect(screen.getByRole("status", { name: "Cargando panel de soporte" })).toBeTruthy();
    resolveDashboard?.(success({ stats: { unassigned: 0, mine: 0, highPriority: 0, completedToday: 2 }, priorityTickets: [] }));
    expect(await screen.findByText("No hay solicitudes pendientes en tus áreas de soporte.")).toBeTruthy();
    cleanup();
    clients[clients.length - 1]?.clear();
    endpoint("GET", "/api/v1/dashboard", () => errorResponse(403, "DASHBOARD_FAILED"));
    renderWithClient(<SupportDashboardContent />);
    expect(await screen.findByText("Mensaje del servidor")).toBeTruthy();
    expect(view.container.isConnected).toBe(false);
  });
});

describe("SUPPORT queue", () => {
  it("uses real assignment filters, displays assignee, and preserves filters for pagination", async () => {
    endpoint("GET", "/api/v1/tickets", (request) => {
      const params = new URL(request.url).searchParams;
      expect(params.get("assignment")).toBe("unassigned");
      expect(params.get("supportArea")).toBe("NETWORKS");
      expect(params.get("categoryId")).toBe(categoryId);
      return success([{ ...ticket, assignee: { id: supportUser.id, fullName: supportUser.fullName } }], 200, { page: 1, pageSize: 5, total: 6, totalPages: 2 });
    });
    endpoint("GET", "/api/v1/catalog/ticket-form", () => success(ticketFormCatalog));
    const view = renderWithClient(<TicketListExperience filters={{ page: 1, pageSize: 5, assignment: "unassigned", supportArea: "NETWORKS", categoryId }} role="SUPPORT" supportAreas={supportUser.supportAreas.filter(isSupportArea)} />);
    expect(await screen.findByText("Cola de soporte")).toBeTruthy();
    expect(screen.getByLabelText("Asignación")).toBeTruthy();
    expect(screen.getByLabelText("Área de soporte")).toBeTruthy();
    expect(screen.getByLabelText("Categoría")).toBeTruthy();
    expect(screen.getAllByText("Persona de prueba").length).toBeGreaterThan(0);
    expect(await screen.findByText("Página 1 de 2 · 6 tickets")).toBeTruthy();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenCalledWith(`/tickets?page=2&pageSize=5&assignment=unassigned&supportArea=NETWORKS&categoryId=${categoryId}`);
    expect(view.container.querySelector("[aria-label='Tickets de soporte']")).toBeTruthy();
  });

  it("shows an empty state and keeps SUB_MANAGER on its staged placeholder", async () => {
    endpoint("GET", "/api/v1/tickets", () => success([], 200, { page: 1, pageSize: 10, total: 0, totalPages: 0 }));
    endpoint("GET", "/api/v1/catalog/ticket-form", () => success(ticketFormCatalog));
    renderWithClient(<TicketListExperience filters={{}} role="SUPPORT" />);
    expect(await screen.findByText("No hay solicitudes pendientes en tus áreas de soporte.")).toBeTruthy();
    cleanup();
    requests.splice(0);
    renderWithClient(<TicketListExperience filters={{}} role="SUB_MANAGER" />);
    expect(await screen.findByText("Esta vista se implementará en la siguiente etapa.")).toBeTruthy();
    expect(requests).toHaveLength(0);
  });

  it("shows queue loading and backend error states", async () => {
    let resolveList: ((response: Response) => void) | undefined;
    endpoint("GET", "/api/v1/catalog/ticket-form", () => success(ticketFormCatalog));
    endpoint("GET", "/api/v1/tickets", () => new Promise<Response>((resolve) => { resolveList = resolve; }));
    renderWithClient(<TicketListExperience filters={{}} role="SUPPORT" />);
    expect(screen.getByRole("status", { name: "Cargando tickets" })).toBeTruthy();
    resolveList?.(success([], 200, { page: 1, pageSize: 10, total: 0, totalPages: 0 }));
    expect(await screen.findByText("No hay solicitudes pendientes en tus áreas de soporte.")).toBeTruthy();
    cleanup();
    endpoint("GET", "/api/v1/tickets", () => errorResponse(403, "QUEUE_FORBIDDEN"));
    renderWithClient(<TicketListExperience filters={{}} role="SUPPORT" />);
    expect(await screen.findByText("No se pudo cargar la cola de soporte")).toBeTruthy();
  });
});

describe("SUPPORT ticket actions", () => {
  it("confirms self-assignment, sends an empty body, and invalidates related queries", async () => {
    let submitted: unknown;
    endpoint("POST", `/api/v1/tickets/${ticketId}/assign-self`, async (request) => {
      submitted = await request.json();
      return success({ id: ticketId, code: ticket.code, assignee: { id: supportUser.id, fullName: supportUser.fullName }, assignedAt: "2026-10-02T12:00:00.000Z" });
    });
    const onRefresh = vi.fn();
    const { client } = renderWithClient(<SupportTicketActions onRefresh={onRefresh} ticket={detail} user={supportUser} />);
    client.setQueryData(dashboardKey, { stats: {} });
    client.setQueryData(ticketListKey({}), { tickets: [ticket] });
    client.setQueryData(ticketDetailKey(ticketId), detail);
    client.setQueryData(ticketEventsKey(ticketId), [] as TicketEvent[]);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Tomar ticket" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar toma" }));
    expect(await screen.findByText("Ticket asignado correctamente.")).toBeTruthy();
    expect(submitted).toEqual({});
    expect(requests[0].headers.get("Idempotency-Key")).toBeNull();
    expect(client.getQueryState(dashboardKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(ticketListKey({}))?.isInvalidated).toBe(true);
    expect(client.getQueryState(ticketDetailKey(ticketId))?.isInvalidated).toBe(true);
    expect(client.getQueryState(ticketEventsKey(ticketId))?.isInvalidated).toBe(true);
  });

  it("blocks duplicate assignment while pending and preserves the backend 409 with refetch", async () => {
    let resolveAssignment: ((response: Response) => void) | undefined;
    endpoint("POST", `/api/v1/tickets/${ticketId}/assign-self`, () => new Promise<Response>((resolve) => { resolveAssignment = resolve; }));
    const onRefresh = vi.fn();
    renderWithClient(<SupportTicketActions onRefresh={onRefresh} ticket={detail} user={supportUser} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Tomar ticket" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar toma" }));
    expect(screen.getByRole("button", { name: "Procesando…" }).hasAttribute("disabled")).toBe(true);
    resolveAssignment?.(errorResponse(409, "TICKET_ALREADY_ASSIGNED"));
    expect((await screen.findByRole("alert")).textContent).toContain("Mensaje del servidor");
    expect(requests.filter((request) => request.method === "POST")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Volver a consultar el ticket" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows status controls only for the current assignee and sends status with a fresh idempotency key", async () => {
    const payloads: Array<{ body: unknown; key: string | null }> = [];
    endpoint("PATCH", `/api/v1/tickets/${ticketId}/status`, async (request) => {
      payloads.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") });
      return success({ id: ticketId, code: ticket.code, status: "IN_REVIEW", updatedAt: "2026-10-02T12:00:00.000Z" });
    });
    const assignedToSelf = { ...detail, assignee: { id: supportUser.id, fullName: supportUser.fullName } };
    const { client } = renderWithClient(<SupportTicketActions onRefresh={vi.fn()} ticket={assignedToSelf} user={supportUser} />);
    client.setQueryData(dashboardKey, { stats: {} });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Marcar en revisión" }));
    expect(await screen.findByText("Estado actualizado.")).toBeTruthy();
    expect(payloads[0]?.body).toEqual({ status: "IN_REVIEW" });
    expect(payloads[0]?.key).toMatch(/^[0-9a-f-]{36}$/iu);
    await user.click(screen.getByRole("button", { name: "Marcar en revisión" }));
    await waitFor(() => expect(payloads).toHaveLength(2));
    expect(payloads[1]?.key).toBeTruthy();
    expect(payloads[1]?.key).not.toBe(payloads[0]?.key);
    expect(client.getQueryState(dashboardKey)?.isInvalidated).toBe(true);
    cleanup();
    endpoint("PATCH", `/api/v1/tickets/${ticketId}/status`, () => success({ id: ticketId, code: ticket.code, status: "IN_REVIEW", updatedAt: "2026-10-02T12:00:00.000Z" }));
    renderWithClient(<SupportTicketActions onRefresh={vi.fn()} ticket={{ ...assignedToSelf, assignee: { id: "88888888-8888-4888-8888-888888888888", fullName: "Otro técnico" } }} user={supportUser} />);
    expect(screen.getByText("Este ticket está asignado a Otro técnico. La vista es de solo lectura.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Marcar en revisión" })).toBeNull();
  });

  it("locks status submission while pending and shows the backend conflict without retry", async () => {
    let resolveStatus: ((response: Response) => void) | undefined;
    endpoint("PATCH", `/api/v1/tickets/${ticketId}/status`, () => new Promise<Response>((resolve) => { resolveStatus = resolve; }));
    const assignedToSelf = { ...detail, assignee: { id: supportUser.id, fullName: supportUser.fullName } };
    const onRefresh = vi.fn();
    renderWithClient(<SupportTicketActions onRefresh={onRefresh} ticket={assignedToSelf} user={supportUser} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Marcar en revisión" }));
    expect(screen.getAllByRole("button", { name: "Actualizando estado…" }).every((button) => button.hasAttribute("disabled"))).toBe(true);
    resolveStatus?.(errorResponse(409, "INVALID_TRANSITION"));
    expect((await screen.findByRole("alert")).textContent).toContain("Mensaje del servidor");
    expect(requests.filter((request) => request.method === "PATCH")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Volver a consultar el ticket" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("requires a cancellation note, confirms terminal change, and sends the generated header", async () => {
    let submitted: unknown;
    let key: string | null = null;
    endpoint("PATCH", `/api/v1/tickets/${ticketId}/status`, async (request) => {
      submitted = await request.json();
      key = request.headers.get("Idempotency-Key");
      return success({ id: ticketId, code: ticket.code, status: "CANCELLED", updatedAt: "2026-10-02T12:00:00.000Z" });
    });
    const assignedToSelf = { ...detail, assignee: { id: supportUser.id, fullName: supportUser.fullName }, status: "IN_PROGRESS" };
    renderWithClient(<SupportTicketActions onRefresh={vi.fn()} ticket={assignedToSelf} user={supportUser} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Cancelar ticket" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar cancelación" }));
    expect(await screen.findByText("Escribe una nota para cancelar el ticket.")).toBeTruthy();
    await user.type(screen.getByLabelText("Nota de cancelación"), "Solicitud atendida por otra vía");
    await user.click(screen.getByRole("button", { name: "Confirmar cancelación" }));
    expect(await screen.findByText("Estado actualizado.")).toBeTruthy();
    expect(submitted).toEqual({ status: "CANCELLED", note: "Solicitud atendida por otra vía" });
    expect(key).toMatch(/^[0-9a-f-]{36}$/iu);
    expect(requests[0]?.method).toBe("PATCH");
  });

  it("keeps terminal tickets read-only and never exposes support actions to USER", async () => {
    renderWithClient(<SupportTicketActions onRefresh={vi.fn()} ticket={{ ...detail, status: "COMPLETED" }} user={supportUser} />);
    expect(screen.getByText("Este ticket ya está finalizado.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tomar ticket" })).toBeNull();
    cleanup();
    endpoint("GET", `/api/v1/tickets/${ticketId}`, () => success(detail));
    endpoint("GET", `/api/v1/tickets/${ticketId}/events`, () => success([]));
    endpoint("GET", "/api/v1/auth/me", () => success(testUser));
    renderWithClient(<TicketDetailView ticketId={ticketId} />, testUser);
    expect(screen.queryByRole("heading", { name: "Acciones de soporte" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tomar ticket" })).toBeNull();
  });
});
