// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { currentUserKey } from "../src/features/auth/queries/current-user";
import { AdminTicketManagement } from "../src/features/tickets/components/admin-ticket-management";
import { TicketDetailView } from "../src/features/tickets/components/ticket-detail-view";
import { TicketListExperience } from "../src/features/tickets/components/ticket-list-view";
import { ticketDetailKey, ticketEventsKey, ticketListKey } from "../src/features/tickets/queries/tickets";
import { dashboardKey } from "../src/features/tickets/queries/dashboard";
import type { CurrentUser } from "../src/features/auth/api";
import type { TicketDetail } from "../src/features/tickets/api";
import { errorResponse, jsonResponse, testUser } from "./auth-fixture";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), usePathname: () => "/tickets" }));

type Handler = (request: Request) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
const requests: Request[] = [];
const clients: QueryClient[] = [];
const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;
const NativeAbortController = transferableAbortController().constructor;
const admin: CurrentUser = { ...testUser, role: "ADMIN" };
const otherSupport: CurrentUser = { ...testUser, id: "22222222-2222-4222-8222-222222222222", fullName: "Soporte alterno", role: "SUPPORT", supportAreas: ["HARDWARE"] };
const ticketId = "44444444-4444-4444-8444-444444444444";
const assignedId = "33333333-3333-4333-8333-333333333333";
const supportId = "55555555-5555-4555-8555-555555555555";
const detail: TicketDetail = {
  id: ticketId, code: "TK-2026-0100", title: "Proyector sin señal", description: "No muestra imagen.", reporter: { fullName: "Persona solicitante" },
  category: { id: "11111111-1111-4111-8111-111111111111", name: "Equipo", supportArea: "HARDWARE" }, subcategory: null,
  location: { building: "Edificio 6", room: "603" }, priority: "HIGH", status: "OPEN",
  assignee: { id: assignedId, fullName: "Técnico actual" }, inventoryItem: null, software: null,
  createdAt: "2026-10-01T12:00:00.000Z", updatedAt: "2026-10-01T12:00:00.000Z", assignedAt: "2026-10-01T12:00:00.000Z", completedAt: null, cancelledAt: null,
};
const supportMember = {
  id: supportId, fullName: "Técnica candidata", email: "tech@example.invalid", institutionalId: "TECH-1", communityType: "TEACHER" as const,
  role: "SUPPORT" as const, supportAreas: ["HARDWARE" as const], skills: ["Proyectores"], isActive: true, googleLinked: true, lastLoginAt: null,
};
const subManager = { ...supportMember, id: "66666666-6666-4666-8666-666666666666", fullName: "Subencargado candidato", role: "SUB_MANAGER" as const };
const inactiveMember = { ...supportMember, id: "77777777-7777-4777-8777-777777777777", fullName: "Técnico inactivo", isActive: false };
const incompatibleMember = { ...supportMember, id: "88888888-8888-4888-8888-888888888888", fullName: "Técnico de redes", supportAreas: ["NETWORKS" as const] };

function endpoint(method: string, path: string, handler: Handler) { handlers.set(`${method} ${path}`, handler); }
function success(data: unknown, status = 200, meta?: unknown) { return jsonResponse({ success: true, data, ...(meta ? { meta } : {}) }, status); }

function renderWithClient(children: ReactNode, user: CurrentUser = admin) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } });
  clients.push(client);
  client.setQueryData(currentUserKey, user);
  return { ...render(<QueryClientProvider client={client}>{children}</QueryClientProvider>), client };
}

function memberList(request: Request) {
  const role = new URL(request.url).searchParams.get("role");
  const rows = role === "SUPPORT" ? [supportMember, inactiveMember, incompatibleMember] : [subManager];
  return success(rows, 200, { page: 1, pageSize: 100, total: rows.length, totalPages: 1 });
}

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); } });
  handlers.clear(); requests.splice(0); push.mockReset();
  endpoint("GET", "/api/v1/auth/me", () => success(admin));
  endpoint("GET", "/api/v1/support-members", memberList);
  endpoint("GET", "/api/v1/catalog/ticket-form", () => success({ maxActiveTickets: 10, categories: [{ id: detail.category.id, code: "EQUIP", name: "Equipo", supportArea: "HARDWARE", defaultPriority: "MEDIUM", requiresSoftwareDetails: false, subcategories: [] }] }));
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    const handler = handlers.get(`${request.method} ${new URL(request.url).pathname}`);
    if (!handler) throw new Error(`Solicitud de prueba no configurada: ${request.method} ${new URL(request.url).pathname}`);
    return handler(request);
  }));
  vi.stubGlobal("AbortController", NativeAbortController);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api/v1");
  vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000");
});

afterEach(() => {
  cleanup(); clients.splice(0).forEach((client) => client.clear()); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: originalShowModal });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: originalClose });
});

describe("ADMIN global ticket list", () => {
  it("uses the global tickets endpoint, real server filters, assignee column and backend pagination", async () => {
    let listRequest: Request | undefined;
    endpoint("GET", "/api/v1/tickets", (request) => { listRequest = request; return success([{ ...detail, category: { id: detail.category.id, name: "Equipo" } }], 200, { page: 2, pageSize: 10, total: 14, totalPages: 2 }); });
    renderWithClient(<TicketListExperience filters={{ page: 2, pageSize: 10, supportArea: "HARDWARE", assignment: "assigned", assignedTo: supportId }} role="ADMIN" />);
    expect(await screen.findByText("Administración global de tickets")).toBeTruthy();
    expect(await screen.findByText("Página 2 de 2 · 14 tickets")).toBeTruthy();
    expect(screen.getAllByText("Técnico actual").length).toBeGreaterThanOrEqual(1);
    const params = new URL(listRequest!.url).searchParams;
    expect(params.get("page")).toBe("2");
    expect(params.get("assignment")).toBe("assigned");
    expect(params.get("supportArea")).toBe("HARDWARE");
    expect(params.get("assignedTo")).toBe(supportId);
    expect(screen.getByLabelText("Técnico asignado")).toBeTruthy();
    expect(screen.getByLabelText("Creado desde")).toBeTruthy();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(push).toHaveBeenCalledWith(`/tickets?page=1&pageSize=10&supportArea=HARDWARE&assignment=assigned&assignedTo=${supportId}`);
  });

  it("shows global empty, loading and error states without client-side authorization filters", async () => {
    let resolveList: ((response: Response) => void) | undefined;
    endpoint("GET", "/api/v1/tickets", () => new Promise<Response>((resolve) => { resolveList = resolve; }));
    renderWithClient(<TicketListExperience filters={{}} role="ADMIN" />);
    expect(screen.getByRole("status", { name: "Cargando tickets" })).toBeTruthy();
    resolveList?.(success([], 200, { page: 1, pageSize: 10, total: 0, totalPages: 0 }));
    expect(await screen.findByText("No hay tickets registrados.")).toBeTruthy();
    cleanup(); clients[clients.length - 1]?.clear();
    endpoint("GET", "/api/v1/tickets", () => errorResponse(403, "ADMIN_TICKETS_FORBIDDEN"));
    renderWithClient(<TicketListExperience filters={{}} role="ADMIN" />);
    expect(await screen.findByText("No se pudo cargar la administración de tickets")).toBeTruthy();
  });
});

describe("ADMIN ticket controls", () => {
  it("lists active compatible SUPPORT and SUB_MANAGER candidates, reassigns by PUT, and patches priority with reason", async () => {
    let assignBody: unknown;
    let priorityBody: unknown;
    endpoint("PUT", `/api/v1/tickets/${ticketId}/assignee`, async (request) => { assignBody = await request.json(); return success({ id: ticketId, code: detail.code, assignee: { id: supportId, fullName: supportMember.fullName }, assignedAt: "2026-10-02T12:00:00.000Z" }); });
    endpoint("PATCH", `/api/v1/tickets/${ticketId}/priority`, async (request) => { priorityBody = await request.json(); return success({ id: ticketId, code: detail.code, priority: "LOW", updatedAt: "2026-10-02T12:00:00.000Z" }); });
    const { client } = renderWithClient(<AdminTicketManagement onRefresh={vi.fn()} ticket={detail} user={admin} />);
    client.setQueryData(ticketListKey({}), { tickets: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });
    client.setQueryData(ticketDetailKey(ticketId), detail);
    client.setQueryData(ticketEventsKey(ticketId), []);
    client.setQueryData(dashboardKey, {});
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Buscar personal activo"), "Técnica");
    await screen.findByRole("option", { name: /Técnica candidata/ });
    await user.selectOptions(screen.getByLabelText("Técnico"), supportId);
    await user.click(screen.getByRole("button", { name: "Reasignar" }));
    await waitFor(() => expect(assignBody).toEqual({ assigneeId: supportId }));
    expect(requests.find((request) => request.method === "PUT")?.headers.get("Idempotency-Key")).toBeNull();
    expect(requests.some((request) => new URL(request.url).searchParams.get("active") === "true" && new URL(request.url).searchParams.get("supportArea") === "HARDWARE" && new URL(request.url).searchParams.get("role") === "SUB_MANAGER")).toBe(true);
    expect(screen.queryByRole("option", { name: /Técnico inactivo/ })).toBeNull();
    expect(screen.queryByRole("option", { name: /Técnico de redes/ })).toBeNull();
    await user.selectOptions(screen.getByLabelText("Nueva prioridad"), "LOW");
    await user.type(screen.getByLabelText("Motivo del cambio"), "Impacto menor al inicialmente estimado");
    await user.click(screen.getByRole("button", { name: "Actualizar prioridad" }));
    await waitFor(() => expect(priorityBody).toEqual({ priority: "LOW", reason: "Impacto menor al inicialmente estimado" }));
    expect(requests.find((request) => request.method === "PATCH")?.headers.get("Idempotency-Key")).toBeNull();
    expect(client.getQueryState(ticketListKey({}))?.isInvalidated).toBe(true);
    expect(client.getQueryState(ticketDetailKey(ticketId))?.isInvalidated).toBe(true);
    expect(client.getQueryState(ticketEventsKey(ticketId))?.isInvalidated).toBe(true);
    expect(client.getQueryState(dashboardKey)?.isInvalidated).toBe(true);
  });

  it("confirms unassignment and sends DELETE; hides administrative actions from SUPPORT", async () => {
    endpoint("DELETE", `/api/v1/tickets/${ticketId}/assignee`, () => new Response(null, { status: 204 }));
    const user = userEvent.setup();
    renderWithClient(<AdminTicketManagement onRefresh={vi.fn()} ticket={detail} user={admin} />);
    await user.click(screen.getByRole("button", { name: "Desasignar" }));
    expect(await screen.findByText("El ticket quedará sin técnico asignado.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Desasignar técnico" }));
    expect(await screen.findByText("Ticket desasignado correctamente.")).toBeTruthy();
    expect(requests.some((request) => request.method === "DELETE")).toBe(true);

    cleanup();
    endpoint("GET", "/api/v1/auth/me", () => success(otherSupport));
    endpoint("GET", `/api/v1/tickets/${ticketId}`, () => success(detail));
    endpoint("GET", `/api/v1/tickets/${ticketId}/events`, () => success([]));
    renderWithClient(<TicketDetailView ticketId={ticketId} />, otherSupport);
    expect(await screen.findByText("Acciones de soporte")).toBeTruthy();
    expect(screen.queryByText("Administración del ticket")).toBeNull();
    expect(screen.queryByLabelText("Nueva prioridad")).toBeNull();
  });

  it("lets ADMIN change status without assigned-to-self and retains the Idempotency-Key", async () => {
    let statusBody: unknown;
    let idempotencyKey: string | null = null;
    endpoint("GET", `/api/v1/tickets/${ticketId}`, () => success(detail));
    endpoint("GET", `/api/v1/tickets/${ticketId}/events`, () => success([]));
    endpoint("PATCH", `/api/v1/tickets/${ticketId}/status`, async (request) => { statusBody = await request.json(); idempotencyKey = request.headers.get("Idempotency-Key"); return success({ id: ticketId, code: detail.code, status: "IN_PROGRESS", updatedAt: "2026-10-02T12:00:00.000Z" }); });
    renderWithClient(<TicketDetailView ticketId={ticketId} />);
    await userEvent.setup().click(await screen.findByRole("button", { name: "Iniciar atención" }));
    await waitFor(() => expect(statusBody).toEqual({ status: "IN_PROGRESS" }));
    expect(idempotencyKey).toMatch(/^[0-9a-f-]{36}$/iu);
    expect(screen.getByText("Administración del ticket")).toBeTruthy();
  });

  it("does not send same-assignee requests and preserves assignment conflicts with request id", async () => {
    const alreadyAssigned = { ...detail, assignee: { id: supportId, fullName: supportMember.fullName } };
    endpoint("PUT", `/api/v1/tickets/${ticketId}/assignee`, () => errorResponse(409, "ASSIGNMENT_CONFLICT"));
    renderWithClient(<AdminTicketManagement onRefresh={vi.fn()} ticket={alreadyAssigned} user={admin} />);
    const user = userEvent.setup();
    await screen.findByRole("option", { name: /Técnica candidata/ });
    expect(screen.getByRole("option", { name: /Técnica candidata.*Actual/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Reasignar" }).hasAttribute("disabled")).toBe(true);
    expect(requests.some((request) => request.method === "PUT")).toBe(false);
    await user.selectOptions(screen.getByLabelText("Técnico"), subManager.id);
    await user.click(screen.getByRole("button", { name: "Reasignar" }));
    expect(await screen.findByText("Mensaje del servidor")).toBeTruthy();
    expect(await screen.findByText(/Solicitud: test-request/)).toBeTruthy();
    expect(requests.some((request) => request.method === "PUT")).toBe(true);
  });
});
