// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { UserDashboardContent } from "../src/features/tickets/components/user-dashboard";
import { TicketListExperience } from "../src/features/tickets/components/ticket-list-view";
import { CreateTicketForm } from "../src/features/tickets/components/create-ticket-form";
import { TicketDetailView } from "../src/features/tickets/components/ticket-detail-view";
import { ProfileForm } from "../src/features/profile/components/profile-form";
import { currentUserKey } from "../src/features/auth/queries/current-user";
import { jsonResponse, errorResponse, testUser } from "./auth-fixture";

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }), usePathname: () => "/tickets" }));

type Handler = (request: Request) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
const requests: string[] = [];
const fetchMock = vi.fn<typeof fetch>();
const NativeAbortController = transferableAbortController().constructor;
const clients: QueryClient[] = [];

const categoryId = "11111111-1111-4111-8111-111111111111";
const anotherCategoryId = "33333333-3333-4333-8333-333333333333";
const subcategoryId = "22222222-2222-4222-8222-222222222222";
const ticketId = "44444444-4444-4444-8444-444444444444";

const catalog = {
  maxActiveTickets: 10 as const,
  categories: [
    { id: categoryId, code: "EQUIP", name: "Equipo", supportArea: "HARDWARE" as const, defaultPriority: "MEDIUM" as const, requiresSoftwareDetails: false, subcategories: [{ id: subcategoryId, code: "PROJ", name: "Proyector", priority: null }] },
    { id: anotherCategoryId, code: "RED", name: "Conectividad", supportArea: "NETWORKS" as const, defaultPriority: "LOW" as const, requiresSoftwareDetails: false, subcategories: [] },
  ],
};

const ticket = {
  id: ticketId, code: "TK-2026-0001", title: "Proyector sin señal",
  category: { id: categoryId, name: "Equipo" }, subcategory: null,
  location: { building: "Edificio 6", room: "603" }, priority: "MEDIUM" as const,
  status: "OPEN" as const, assignee: null, createdAt: "2026-10-01T12:00:00.000Z",
};

const detail = {
  id: ticketId, code: ticket.code, title: ticket.title, description: "Enciende, pero no muestra señal.",
  reporter: { fullName: "Persona de prueba" }, category: { id: categoryId, code: "EQUIP", name: "Equipo", supportArea: "HARDWARE" },
  subcategory: null, location: { building: "Edificio 6", room: "603" }, priority: "HIGH", status: "IN_PROGRESS",
  assignee: { fullName: "Técnico de prueba" }, inventoryItem: null, software: null,
  createdAt: "2026-10-01T12:00:00.000Z", updatedAt: "2026-10-02T12:00:00.000Z", assignedAt: null, completedAt: null, cancelledAt: null,
};

function endpoint(method: string, path: string, handler: Handler) {
  handlers.set(`${method} ${path}`, handler);
}

function success(data: unknown, status = 200, meta?: unknown) {
  return jsonResponse({ success: true, data, ...(meta ? { meta } : {}) }, status);
}

function renderWithClient(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } });
  clients.push(client);
  return { ...render(<QueryClientProvider client={client}>{children}</QueryClientProvider>), client };
}

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
  handlers.clear();
  requests.splice(0);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    requests.push(`${request.method} ${url.pathname}`);
    const handler = handlers.get(`${request.method} ${url.pathname}`);
    if (!handler) throw new Error(`Solicitud de API de prueba no configurada: ${request.method} ${url.pathname}`);
    return handler(request);
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("AbortController", NativeAbortController);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api/v1");
  vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000");
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("dashboard USER", () => {
  it("renders backend metrics and its recent tickets without requesting the listing", async () => {
    endpoint("GET", "/api/v1/dashboard", () => success({ stats: { active: 3, inProgress: 1, completed: 4 }, recentTickets: [ticket] }));
    renderWithClient(<UserDashboardContent />);
    expect(await screen.findByText("Tickets activos")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getAllByText("TK-2026-0001")).toHaveLength(2);
    expect(fetchMock.mock.calls).toHaveLength(1);
    expect(requests).toEqual(["GET /api/v1/dashboard"]);
  });

  it("shows the empty-state action when backend metrics and recent tickets are empty", async () => {
    endpoint("GET", "/api/v1/dashboard", () => success({ stats: { active: 0, inProgress: 0, completed: 0 }, recentTickets: [] }));
    renderWithClient(<UserDashboardContent />);
    expect(await screen.findByText("Aún no tienes solicitudes de soporte.")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Crear ticket" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Crear ticket" }).every((link) => link.getAttribute("href") === "/tickets/new")).toBe(true);
    expect(screen.getAllByText("0")).toHaveLength(3);
  });
});

describe("USER ticket listing", () => {
  it("renders the server page, responsive cards, and backend pagination", async () => {
    endpoint("GET", "/api/v1/tickets", () => success([ticket], 200, { page: 1, pageSize: 5, total: 6, totalPages: 2 }));
    endpoint("GET", "/api/v1/catalog/ticket-form", () => success(catalog));
    renderWithClient(<TicketListExperience filters={{ page: 1, pageSize: 5 }} role="USER" />);
    expect(await screen.findByText("Página 1 de 2 · 6 tickets")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Ver ticket TK-2026-0001: Proyector sin señal" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Siguiente" }).hasAttribute("disabled")).toBe(false);
  });

  it("uses an empty state and keeps staff on the staged placeholder", async () => {
    endpoint("GET", "/api/v1/tickets", () => success([], 200, { page: 1, pageSize: 10, total: 0, totalPages: 0 }));
    endpoint("GET", "/api/v1/catalog/ticket-form", () => success(catalog));
    renderWithClient(<TicketListExperience filters={{}} role="USER" />);
    expect(await screen.findByText("Aún no tienes solicitudes de soporte.")).toBeTruthy();
    cleanup();
    fetchMock.mockClear();
    renderWithClient(<TicketListExperience filters={{}} role="SUPPORT" />);
    expect(await screen.findByText("Esta vista se implementará en la siguiente etapa.")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves filters in URL navigation and ignores malformed subcategory IDs", async () => {
    endpoint("GET", "/api/v1/tickets", (request) => {
      expect(new URL(request.url).searchParams.get("subcategoryId")).toBeNull();
      return success([ticket], 200, { page: 1, pageSize: 5, total: 1, totalPages: 1 });
    });
    endpoint("GET", "/api/v1/catalog/ticket-form", () => success(catalog));
    const view = renderWithClient(<TicketListExperience filters={{ page: 2, status: "OPEN", subcategoryId: "55555555-5555-4555-8555-555555555555" }} role="USER" />);
    expect(await screen.findByText("Mis tickets")).toBeTruthy();
    expect((await screen.findAllByText("TK-2026-0001")).length).toBeGreaterThan(0);
    expect(view.container.querySelector("form")).toBeTruthy();
  });
});

describe("ticket creation", () => {
  it("loads the real form catalog, clears a stale subcategory, and submits only request fields", async () => {
    let submitted: unknown;
    endpoint("GET", "/api/v1/catalog/ticket-form", () => success(catalog));
    endpoint("POST", "/api/v1/tickets", async (request) => { submitted = JSON.parse(await request.text()); return success({ id: ticketId }, 201); });
    const user = userEvent.setup();
    renderWithClient(<CreateTicketForm user={testUser} />);
    const categorySelect = await screen.findByLabelText(/Categoría/);
    await user.selectOptions(categorySelect, categoryId);
    const subcategorySelect = screen.getByLabelText(/Subcategoría/);
    await user.selectOptions(subcategorySelect, subcategoryId);
    await user.selectOptions(categorySelect, anotherCategoryId);
    await user.type(screen.getByLabelText(/Título/), "Solicitud de prueba");
    await user.type(screen.getByLabelText(/Edificio/), "Edificio 6");
    await user.type(screen.getByLabelText(/Descripción/), "El equipo no funciona correctamente.");
    await user.click(screen.getByRole("button", { name: "Crear ticket" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/tickets/${ticketId}`));
    expect(submitted).toEqual({
      title: "Solicitud de prueba", categoryId: anotherCategoryId, building: "Edificio 6", room: null,
      description: "El equipo no funciona correctamente.", contactPhone: null,
    });
    expect(submitted).not.toHaveProperty("subcategoryId");
    expect(submitted).not.toHaveProperty("status");
    expect(submitted).not.toHaveProperty("priority");
    expect(submitted).not.toHaveProperty("inventoryItemId");
  });

  it("keeps entered values after a backend conflict and exposes the request id", async () => {
    const softwareCatalog = { maxActiveTickets: 10 as const, categories: [{ ...catalog.categories[0], requiresSoftwareDetails: false }] };
    endpoint("GET", "/api/v1/catalog/ticket-form", () => success(softwareCatalog));
    endpoint("POST", "/api/v1/tickets", () => errorResponse(409, "TICKET_CONFLICT"));
    const user = userEvent.setup();
    renderWithClient(<CreateTicketForm user={testUser} />);
    await user.selectOptions(await screen.findByLabelText(/Categoría/), categoryId);
    await user.selectOptions(screen.getByLabelText(/Subcategoría/), subcategoryId);
    await user.type(screen.getByLabelText(/Título/), "Ticket que se conserva");
    await user.type(screen.getByLabelText(/Edificio/), "Edificio 6");
    await user.type(screen.getByLabelText(/Descripción/), "El equipo no funciona.");
    await user.click(screen.getByRole("button", { name: "Crear ticket" }));
    expect(await screen.findByText("Mensaje del servidor")).toBeTruthy();
    expect(screen.getByText("Solicitud: test-request")).toBeTruthy();
    expect(screen.getByDisplayValue("Ticket que se conserva")).toBeTruthy();
  });

  it("shows software detail fields only when the backend catalog requires them and honors the teacher restriction", async () => {
    const softwareCatalog = { maxActiveTickets: 10 as const, categories: [{ ...catalog.categories[0], supportArea: "SOFTWARE" as const, requiresSoftwareDetails: true, subcategories: [] }] };
    endpoint("GET", "/api/v1/catalog/ticket-form", () => success(softwareCatalog));
    renderWithClient(<CreateTicketForm user={testUser} />);
    await userEvent.selectOptions(await screen.findByLabelText(/Categoría/), categoryId);
    expect(screen.getByLabelText(/URL de descarga/)).toBeTruthy();
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("requieren perfil docente"))).toBe(true);
    expect(screen.getByRole("button", { name: "Crear ticket" }).hasAttribute("disabled")).toBe(true);
  });
});

describe("ticket detail and event timeline", () => {
  it("renders fields from the detail response and the chronological event feed", async () => {
    const event = { id: "66666666-6666-4666-8666-666666666666", type: "CREATED" as const, actor: { fullName: "Persona de prueba" }, fromStatus: null, toStatus: "OPEN", metadata: {}, createdAt: "2026-10-01T12:00:00.000Z" };
    endpoint("GET", `/api/v1/tickets/${ticketId}`, () => success(detail));
    endpoint("GET", `/api/v1/tickets/${ticketId}/events`, () => success([event]));
    renderWithClient(<TicketDetailView ticketId={ticketId} />);
    expect(await screen.findByText("Enciende, pero no muestra señal.")).toBeTruthy();
    expect(screen.getAllByText("TK-2026-0001")).toHaveLength(1);
    expect(await screen.findByText("Solicitud creada")).toBeTruthy();
    expect(screen.getByText(/Abierto/)).toBeTruthy();
    expect(screen.getByText("Técnico de prueba")).toBeTruthy();
  });

  it("handles a missing ticket and an empty event response", async () => {
    endpoint("GET", `/api/v1/tickets/${ticketId}`, () => success(detail));
    endpoint("GET", `/api/v1/tickets/${ticketId}/events`, () => success([]));
    renderWithClient(<TicketDetailView ticketId={ticketId} />);
    expect(await screen.findByText("Todavía no hay eventos para mostrar.")).toBeTruthy();
    cleanup();
    endpoint("GET", `/api/v1/tickets/${ticketId}`, () => jsonResponse({ success: false, error: { code: "NOT_FOUND", message: "Ticket no encontrado" }, requestId: "req-404" }, 404));
    renderWithClient(<TicketDetailView ticketId={ticketId} />);
    expect(await screen.findByText("No encontramos este ticket")).toBeTruthy();
    expect(screen.getByText("Solicitud: req-404")).toBeTruthy();
  });
});

describe("editable user profile", () => {
  it("sends only fullName and phone and invalidates the shared current-user cache", async () => {
    let submitted: unknown;
    endpoint("PATCH", "/api/v1/users/me", async (request) => { submitted = JSON.parse(await request.text()); return success({ ...testUser, fullName: "Nombre actualizado", phone: null }); });
    const user = userEvent.setup();
    const { client } = renderWithClient(<ProfileForm user={testUser} />);
    client.setQueryData(currentUserKey, testUser);
    const name = screen.getByLabelText("Nombre completo");
    await user.clear(name);
    await user.type(name, "Nombre actualizado");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Perfil actualizado correctamente.")).toBeTruthy();
    expect(submitted).toEqual({ fullName: "Nombre actualizado", phone: null });
    expect(client.getQueryState(currentUserKey)?.isInvalidated).toBe(true);
  });

  it("maps backend validation errors onto the editable profile field without clearing it", async () => {
    endpoint("PATCH", "/api/v1/users/me", () => jsonResponse({ success: false, error: { code: "VALIDATION_ERROR", message: "Revisa el perfil.", fields: { fullName: ["Nombre no válido."] } }, requestId: "profile-422" }, 422));
    const user = userEvent.setup();
    renderWithClient(<ProfileForm user={testUser} />);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Nombre no válido.")).toBeTruthy();
    expect(screen.getByDisplayValue(testUser.fullName)).toBeTruthy();
  });
});
