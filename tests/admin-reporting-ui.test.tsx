// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { currentUserKey } from "../src/features/auth/queries/current-user";
import { DashboardExperience } from "../src/features/tickets/components/user-dashboard";
import { ActivityReportView } from "../src/features/reports/components/activity-report-view";
import { activityReportKey } from "../src/features/reports/queries/activity-report";
import type { ActivityReport, ActivityReportFilters } from "../src/features/reports/api";
import type { CurrentUser } from "../src/features/auth/api";
import { adminDashboardKey, dashboardKey, supportDashboardKey, userDashboardKey } from "../src/features/tickets/queries/dashboard";
import { errorResponse, jsonResponse, testUser } from "./auth-fixture";

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace, usePathname: () => "/reports" }) }));

type Handler = (request: Request) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
const requests: Request[] = [];
const clients: QueryClient[] = [];
const NativeAbortController = transferableAbortController().constructor;
const admin: CurrentUser = { ...testUser, role: "ADMIN" };
const categoryId = "11111111-1111-4111-8111-111111111111";
const technicianId = "22222222-2222-4222-8222-222222222222";
const category = { id: categoryId, code: "PROJECTOR", name: "Proyectores", supportArea: "HARDWARE" as const, defaultPriority: "MEDIUM" as const, requiresSoftwareDetails: false, isActive: true, subcategories: [] };
const technician = { id: technicianId, fullName: "Ana López", email: "ana@example.invalid", institutionalId: "A-1", role: "SUPPORT" as const, supportAreas: ["HARDWARE" as const], skills: [], isActive: true, googleLinked: true, lastLoginAt: null };
const reportData: ActivityReport = {
  summary: { ticketsCreated: 5, ticketsCompleted: 3, pending: 2, averageResolutionMinutes: 90 },
  byCategory: [{ categoryId, category: "Proyectores", count: 5 }],
  byTechnician: [{ technicianId, name: "Ana López", completed: 3, active: 2 }],
  daily: [{ date: "2026-10-01", created: 2, completed: 1 }, { date: "2026-10-02", created: 3, completed: 2 }],
};
const filters: ActivityReportFilters = { from: "2026-10-01", to: "2026-10-02" };

function endpoint(method: string, path: string, handler: Handler) { handlers.set(`${method} ${path}`, handler); }
function success(data: unknown, status = 200, meta?: unknown) { return jsonResponse({ success: true, data, ...(meta ? { meta } : {}) }, status); }
function renderWithClient(children: ReactNode, user = admin) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } });
  clients.push(client);
  client.setQueryData(currentUserKey, user);
  return { ...render(<QueryClientProvider client={client}>{children}</QueryClientProvider>), client };
}

beforeEach(() => {
  handlers.clear(); requests.splice(0); push.mockReset(); replace.mockReset();
  endpoint("GET", "/api/v1/auth/me", () => success(admin));
  endpoint("GET", "/api/v1/categories", () => success([category]));
  endpoint("GET", "/api/v1/support-members", (request) => {
    const params = new URL(request.url).searchParams;
    const active = params.get("active");
    const role = params.get("role");
    const result = active === "true" && role === "SUPPORT" ? [technician] : [];
    return success(result, 200, { page: 1, pageSize: 100, total: result.length, totalPages: result.length ? 1 : 0 });
  });
  endpoint("GET", "/api/v1/reports/activity", () => success(reportData));
  endpoint("GET", "/api/v1/dashboard", () => success({ stats: { activeTickets: 12, unassigned: 4, activeTechnicians: 3, inventoryItems: 25 }, technicianWorkload: [{ userId: technicianId, name: "Ana López", supportAreas: ["HARDWARE", "NETWORKS"], activeTickets: 2, completedToday: 1 }] }));
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
});

describe("ADMIN dashboard", () => {
  it("uses a distinct cache entry for each role-specific dashboard contract", () => {
    expect(new Set([userDashboardKey.join("/"), supportDashboardKey.join("/"), adminDashboardKey.join("/")]).size).toBe(3);
  });

  it("selects the ADMIN dashboard by session role and renders real metrics and workload", async () => {
    const { client } = renderWithClient(<DashboardExperience />);
    expect(await screen.findByText("Panel administrativo")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("25")).toBeTruthy();
    expect(screen.getAllByText("Tickets activos").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Ana López")).toHaveLength(2);
    expect(screen.getAllByText("Completados hoy")).toHaveLength(2);
    expect(requests.filter((request) => new URL(request.url).pathname === "/api/v1/dashboard")).toHaveLength(1);
    expect(client.getQueryState(adminDashboardKey)?.status).toBe("success");
    expect(client.getQueryState(dashboardKey)?.status).toBeUndefined();
  });

  it("shows loading and empty workload states", async () => {
    let resolveDashboard: ((response: Response) => void) | undefined;
    endpoint("GET", "/api/v1/dashboard", () => new Promise<Response>((resolve) => { resolveDashboard = resolve; }));
    const view = renderWithClient(<DashboardExperience />);
    expect(screen.getByRole("status", { name: "Cargando panel administrativo" })).toBeTruthy();
    await waitFor(() => expect(resolveDashboard).toBeTypeOf("function"));
    resolveDashboard?.(success({ stats: { activeTickets: 0, unassigned: 0, activeTechnicians: 0, inventoryItems: 0 }, technicianWorkload: [] }));
    expect(await screen.findByText("No hay carga de técnicos para mostrar.")).toBeTruthy();
    expect(view.container.isConnected).toBe(true);
  });

});

describe("ADMIN activity reports", () => {
  it("requests the current date-only filters, renders summary/category/technician/daily data, and persists defaults", async () => {
    renderWithClient(<ActivityReportView filters={filters} rangeValid shouldPersistDefaultRange />);
    expect(await screen.findByText("Tickets creados")).toBeTruthy();
    expect(screen.getByText("1 h 30 min")).toBeTruthy();
    expect(screen.getAllByText("Proyectores").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Ana López")).toBeTruthy();
    expect(screen.getByText("01/10/2026")).toBeTruthy();
    const reportRequest = requests.find((request) => new URL(request.url).pathname === "/api/v1/reports/activity");
    expect(reportRequest && new URL(reportRequest.url).searchParams.get("from")).toBe("2026-10-01");
    expect(reportRequest && new URL(reportRequest.url).searchParams.get("to")).toBe("2026-10-02");
    expect(replace).toHaveBeenCalledWith("/reports?from=2026-10-01&to=2026-10-02", { scroll: false });
  });

  it("submits only supported area/category/technician params, retains report query key, and resets to defaults", async () => {
    const user = userEvent.setup();
    const { client } = renderWithClient(<ActivityReportView filters={filters} rangeValid shouldPersistDefaultRange={false} />);
    await screen.findByText("Tickets completados");
    await screen.findByRole("option", { name: "Ana López · Soporte" });
    await user.selectOptions(screen.getByLabelText("Área de soporte"), "HARDWARE");
    await user.selectOptions(screen.getByLabelText("Categoría"), categoryId);
    await user.selectOptions(screen.getByLabelText("Técnico"), technicianId);
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(push).toHaveBeenCalledWith(`/reports?from=2026-10-01&to=2026-10-02&supportArea=HARDWARE&categoryId=${categoryId}&technicianId=${technicianId}`);
    expect(client.getQueryState(activityReportKey(filters))?.status).toBe("success");
    await user.click(screen.getByRole("button", { name: /Limpiar filtros/ }));
    expect(push).toHaveBeenCalledWith("/reports");
  });

  it("does not request inverted periods and preserves filters on a backend error", async () => {
    const invalidFilters: ActivityReportFilters = { from: "2026-10-02", to: "2026-10-01" };
    renderWithClient(<ActivityReportView filters={invalidFilters} rangeValid={false} shouldPersistDefaultRange={false} />);
    expect(screen.getByText("El periodo recibido no es válido. Corrige las fechas para consultar el reporte.")).toBeTruthy();
    expect(requests.some((request) => new URL(request.url).pathname === "/api/v1/reports/activity")).toBe(false);
    cleanup();
    endpoint("GET", "/api/v1/reports/activity", () => errorResponse(422, "INVALID_REPORT_RANGE"));
    renderWithClient(<ActivityReportView filters={filters} rangeValid shouldPersistDefaultRange={false} />);
    expect(await screen.findByText("No se pudo cargar el reporte")).toBeTruthy();
    expect(screen.getByText(/test-request/u)).toBeTruthy();
    expect((screen.getByLabelText("Desde") as HTMLInputElement).value).toBe(filters.from);
    expect((screen.getByLabelText("Hasta") as HTMLInputElement).value).toBe(filters.to);
  });
});
