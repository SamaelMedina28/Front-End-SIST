// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ActivityLogCreateBlock } from "../src/features/activity-log/components/activity-log-form";
import { ActivityLogCreatePage } from "../src/features/activity-log/components/activity-log-create-page";
import { ActivityLogDetail } from "../src/features/activity-log/components/activity-log-detail";
import { ActivityLogList } from "../src/features/activity-log/components/activity-log-list";
import { currentUserKey } from "../src/features/auth/queries/current-user";
import type { CurrentUser } from "../src/features/auth/api";
import { jsonResponse, testUser } from "./auth-fixture";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const id = "11111111-1111-4111-8111-111111111111";
const ticketId = "22222222-2222-4222-8222-222222222222";
const anotherTicketId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const candidateId = "33333333-3333-4333-8333-333333333333";
const candidateTwoId = "66666666-6666-4666-8666-666666666666";
const candidates = [{ id: candidateId, fullName: "Técnica de prueba", role: "SUPPORT" as const }, { id: candidateTwoId, fullName: "Subencargado alterno", role: "SUB_MANAGER" as const }];
const manager: CurrentUser = { ...testUser, role: "SUB_MANAGER", supportAreas: ["HARDWARE"] };
const support: CurrentUser = { ...testUser, role: "SUPPORT", supportAreas: ["HARDWARE"] };
const entry = {
  id, ticket: { id: ticketId, code: "TK-2026-0010", title: "Equipo sin señal" }, failure: "No enciende",
  activity: "Diagnóstico inicial", participants: [{ id: "33333333-3333-4333-8333-333333333333", fullName: "Técnica de prueba" }],
  serviceStartedAt: "2026-10-05T17:00:00.000Z", serviceEndedAt: null, timeSpentMinutes: 60, status: "IN_PROGRESS" as const,
  createdAt: "2026-10-05T17:00:00.000Z", updatedAt: "2026-10-05T17:00:00.000Z",
  reporter: { fullName: "Reportante snapshot", email: "reporter@example.invalid", phone: null },
  createdBy: { id: "44444444-4444-4444-8444-444444444444", fullName: "Subencargado" },
};
const history = [{ id: "55555555-5555-4555-8555-555555555555", changedBy: entry.createdBy, createdAt: entry.updatedAt,
  previousData: { activity: "Diagnóstico inicial", participantIds: [entry.participants[0]!.id], serviceStartedAt: entry.serviceStartedAt, serviceEndedAt: null, timeSpentMinutes: 60, status: "IN_PROGRESS" as const },
  newData: { activity: "Diagnóstico inicial", participantIds: [entry.participants[0]!.id], serviceStartedAt: entry.serviceStartedAt, serviceEndedAt: null, timeSpentMinutes: 75, status: "COMPLETED" as const } }];
const requests: Request[] = [];
const handlers = new Map<string, (request: Request) => Response | Promise<Response>>();
const NativeAbortController = transferableAbortController().constructor;
function installFetch() {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api/v1");
  vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000");
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init); requests.push(request);
    const url = new URL(request.url);
    const handler = handlers.get(`${request.method} ${url.pathname}`);
    if (!handler) throw new Error(`Unexpected test request: ${request.method} ${url.pathname}`);
    return handler(request);
  }));
  vi.stubGlobal("AbortController", NativeAbortController);
}

function endpoint(method: string, path: string, handler: (request: Request) => Response | Promise<Response>) { handlers.set(`${method} ${path}`, handler); }
function success(data: unknown, meta?: unknown) { return jsonResponse({ success: true, data, ...(meta ? { meta } : {}) }); }
function renderPage(children: ReactNode, user: CurrentUser) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } });
  client.setQueryData(currentUserKey, user);
  return { ...render(<QueryClientProvider client={client}>{children}</QueryClientProvider>), client };
}

afterEach(() => { cleanup(); requests.splice(0); handlers.clear(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("activity log role-aware experience", () => {
  it("lists with API pagination and offers registration only to SUB_MANAGER", async () => {
    endpoint("GET", "/api/v1/activity-log", () => success([entry], { page: 1, pageSize: 1, total: 2, totalPages: 2 }));
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api/v1");
    vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init); requests.push(request);
      const url = new URL(request.url);
      const handler = handlers.get(`${request.method} ${url.pathname}`);
      if (!handler) throw new Error(`Unexpected test request: ${request.method} ${url.pathname}`);
      return handler(request);
    }));
    vi.stubGlobal("AbortController", NativeAbortController);
    const view = renderPage(<ActivityLogList filters={{ search: "equipo" }} role="SUB_MANAGER" />, manager);
    expect(await screen.findByText("Página 1 de 2 · 2 registros")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Registrar actividad" }).getAttribute("href")).toBe("/activity-log/new");
    expect(new URL(requests[0]!.url).searchParams.get("search")).toBe("equipo");
    view.unmount();
    const readOnly = renderPage(<ActivityLogList filters={{}} role="SUPPORT" />, support);
    expect(await screen.findByText("Página 1 de 2 · 2 registros")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Registrar actividad" })).toBeNull();
    expect(screen.getAllByText("TK-2026-0010").length).toBeGreaterThan(0);
    readOnly.unmount();
  });

  it("keeps SUPPORT read-only and does not request history; SUB_MANAGER sees edit and readable history", async () => {
    endpoint("GET", `/api/v1/activity-log/${id}`, () => success(entry));
    endpoint("GET", `/api/v1/activity-log/${id}/history`, () => success(history));
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api/v1");
    vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init); requests.push(request);
      const url = new URL(request.url);
      const handler = handlers.get(`${request.method} ${url.pathname}`);
      if (!handler) throw new Error(`Unexpected test request: ${request.method} ${url.pathname}`);
      return handler(request);
    }));
    vi.stubGlobal("AbortController", NativeAbortController);
    const readOnly = renderPage(<ActivityLogDetail id={id} />, support);
    expect(await screen.findByText("Reportante snapshot")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByText("Historial de revisiones")).toBeNull();
    await waitFor(() => expect(requests.some((request) => request.url.includes("/history"))).toBe(false));
    readOnly.unmount();
    requests.splice(0);
    const managerPage = renderPage(<ActivityLogDetail id={id} />, manager);
    expect(await screen.findByText("Tiempo invertido")).toBeTruthy();
    expect(await screen.findByText("Revisión 1 · Subencargado")).toBeTruthy();
    await userEvent.setup().click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByText("Participantes (solo lectura)")).toBeTruthy();
    managerPage.unmount();
  });

  it("loads candidates for the selected ticket, permits selection, and never calls /support-members", async () => {
    endpoint("GET", "/api/v1/catalog/activity-log-participants", (request) => {
      expect(new URL(request.url).searchParams.get("ticketId")).toBe(ticketId);
      return success(candidates);
    });
    installFetch();
    renderPage(<ActivityLogCreateBlock ticketId={ticketId} />, manager);
    const first = await screen.findByLabelText(/Técnica de prueba/u);
    const second = screen.getByLabelText(/Subencargado alterno/u);
    await userEvent.setup().click(first);
    await userEvent.setup().click(second);
    expect((first as HTMLInputElement).checked).toBe(true);
    expect((second as HTMLInputElement).checked).toBe(true);
    expect(requests.every((request) => !request.url.includes("/support-members"))).toBe(true);
    expect(requests.some((request) => request.url.includes("/catalog/activity-log-participants"))).toBe(true);
  });

  it("refetches candidates after ticket change and clears stale participant selections", async () => {
    endpoint("GET", "/api/v1/catalog/activity-log-participants", (request) => success(new URL(request.url).searchParams.get("ticketId") === ticketId ? candidates : [candidates[1]]));
    installFetch();
    renderPage(<ActivityLogCreateBlock ticketId={ticketId} />, manager);
    const first = await screen.findByLabelText(/Técnica de prueba/u);
    await userEvent.setup().click(first);
    fireEvent.change(screen.getByLabelText("Ticket (UUID)"), { target: { value: anotherTicketId } });
    await screen.findByLabelText(/Subencargado alterno/u);
    expect((screen.getByLabelText(/Subencargado alterno/u) as HTMLInputElement).checked).toBe(false);
    expect(requests.some((request) => new URL(request.url).searchParams.get("ticketId") === anotherTicketId)).toBe(true);
  });

  it("explains empty candidates and prevents submission", async () => {
    endpoint("GET", "/api/v1/catalog/activity-log-participants", () => success([]));
    installFetch();
    renderPage(<ActivityLogCreateBlock ticketId={ticketId} />, manager);
    expect(await screen.findByText(/no tiene participantes elegibles/u)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Registrar actividad" }) as HTMLButtonElement).disabled).toBe(true);
    expect(requests.some((request) => request.method === "POST")).toBe(false);
  });

  it("shows catalog errors with request reference and keeps submit disabled", async () => {
    const { errorResponse } = await import("./auth-fixture");
    endpoint("GET", "/api/v1/catalog/activity-log-participants", () => errorResponse(403));
    installFetch();
    renderPage(<ActivityLogCreateBlock ticketId={ticketId} />, manager);
    expect(await screen.findByText(/No se pudieron cargar los participantes/u)).toBeTruthy();
    expect(screen.getByText(/test-request/u)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Registrar actividad" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("posts real participantIds and keeps SUPPORT creation read-only", async () => {
    endpoint("GET", "/api/v1/catalog/activity-log-participants", () => success(candidates));
    endpoint("POST", "/api/v1/activity-log", async (request) => {
      const body = await request.json() as Record<string, unknown>;
      expect(body.participantIds).toEqual([candidateId]);
      expect(body.ticketId).toBe(ticketId);
      return success(entry);
    });
    installFetch();
    const view = renderPage(<ActivityLogCreatePage ticketId={ticketId} />, manager);
    await userEvent.setup().click(await screen.findByLabelText(/Técnica de prueba/u));
    fireEvent.change(screen.getByLabelText("Actividad"), { target: { value: "Revisión de hardware" } });
    fireEvent.change(screen.getByLabelText("Inicio (hora de Tijuana)"), { target: { value: "2026-10-05T10:00" } });
    fireEvent.change(screen.getByLabelText("Tiempo invertido (minutos)"), { target: { value: "30" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Registrar actividad" }));
    await waitFor(() => expect(requests.some((request) => request.method === "POST" && new URL(request.url).pathname.endsWith("/activity-log"))).toBe(true));
    expect(requests.some((request) => request.url.includes("/support-members"))).toBe(false);
    view.unmount();
    renderPage(<ActivityLogCreatePage ticketId={ticketId} />, support);
    expect(screen.getByText(/únicamente para SUB_MANAGER/u)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Registrar actividad" })).toBeNull();
  });
});
