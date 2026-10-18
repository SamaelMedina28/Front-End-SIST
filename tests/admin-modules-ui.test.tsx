// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { CategoriesAdmin } from "../src/features/categories/components/categories-admin";
import { SupportMemberForm } from "../src/features/support-members/components/support-member-form";
import { SupportMemberList } from "../src/features/support-members/components/support-member-list";
import { SupportMemberDetail } from "../src/features/support-members/components/support-member-detail";
import { useTicketFormCatalog } from "../src/features/tickets/queries/ticket-form";
import type { Category } from "../src/features/categories/api";
import type { SupportMemberListItem } from "../src/features/support-members/api";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), usePathname: () => "/admin/support-members" }));

type Handler = (request: Request) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
const requests: Request[] = [];
const fetchMock = vi.fn<typeof fetch>();
const NativeAbortController = transferableAbortController().constructor;
const clients: QueryClient[] = [];
const categoryId = "11111111-1111-4111-8111-111111111111";
const subcategoryId = "22222222-2222-4222-8222-222222222222";
const memberId = "33333333-3333-4333-8333-333333333333";

function response(data: unknown, status = 200, meta?: unknown) { return new Response(JSON.stringify({ success: true, data, ...(meta ? { meta } : {}) }), { status, headers: { "content-type": "application/json" } }); }
function endpoint(method: string, path: string, handler: Handler) { handlers.set(`${method} ${path}`, handler); }
function renderWithClient(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } }); clients.push(client);
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}
function CatalogProbe() { useTicketFormCatalog(); return null; }
const category: Category = { id: categoryId, code: "TECH_HELP", name: "Soporte técnico", supportArea: "HARDWARE", defaultPriority: null, requiresSoftwareDetails: false, isActive: true, subcategories: [] };
const member: SupportMemberListItem = { id: memberId, fullName: "Técnica Ejemplo", email: "tecnica@example.edu", institutionalId: "A-123", role: "SUPPORT", supportAreas: ["HARDWARE", "SOFTWARE"], skills: ["Mantenimiento"], isActive: true, googleLinked: false, lastLoginAt: null };

beforeEach(() => {
  push.mockReset(); handlers.clear(); requests.splice(0); fetchMock.mockReset();
  fetchMock.mockImplementation(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    requests.push(request);
    const url = new URL(request.url); const handler = handlers.get(`${request.method} ${url.pathname}`);
    if (!handler) throw new Error(`Solicitud API no configurada: ${request.method} ${url.pathname}`);
    return handler(request);
  });
  vi.stubGlobal("fetch", fetchMock); vi.stubGlobal("AbortController", NativeAbortController);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api/v1"); vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000");
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  HTMLDialogElement.prototype.close = function close() { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(() => { cleanup(); clients.splice(0).forEach((client) => client.clear()); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("ADMIN categories and subcategories", () => {
  it("creates real category and subcategory payloads, refreshes the USER catalog, and soft-disables without cascade", async () => {
    let active = true; let categoryExists = false; let savedCategory = category; let currentSubcategories: Category["subcategories"] = []; let categoryBody: unknown; let categoryPatch: unknown; let subcategoryBody: unknown; let subcategoryPatch: unknown; let catalogCalls = 0;
    endpoint("GET", "/api/v1/categories", (request) => {
      expect(new URL(request.url).searchParams.get("includeInactive")).toBe("true");
      return response(categoryExists ? [{ ...savedCategory, isActive: active, subcategories: currentSubcategories }] : []);
    });
    endpoint("GET", "/api/v1/catalog/ticket-form", () => { catalogCalls += 1; return response({ maxActiveTickets: 10, categories: [] }); });
    endpoint("POST", "/api/v1/categories", async (request) => { categoryBody = await request.json(); categoryExists = true; savedCategory = { ...category, ...categoryBody as Omit<Category, "id" | "subcategories"> }; return response(savedCategory, 201); });
    endpoint("PATCH", `/api/v1/categories/${categoryId}`, async (request) => { categoryPatch = await request.json(); savedCategory = { ...savedCategory, ...categoryPatch as Partial<Category> }; return response(savedCategory); });
    endpoint("POST", `/api/v1/categories/${categoryId}/subcategories`, async (request) => {
      expect(new URL(request.url).pathname).toContain(categoryId);
      subcategoryBody = await request.json();
      const added = { id: subcategoryId, categoryId, code: "PROJECTOR_FAILURE", name: "Falla de proyector", priority: null, isActive: true };
      currentSubcategories = [added]; return response(added, 201);
    });
    endpoint("PATCH", `/api/v1/subcategories/${subcategoryId}`, async (request) => { subcategoryPatch = await request.json(); currentSubcategories = currentSubcategories.map((item) => ({ ...item, ...subcategoryPatch as Partial<Category["subcategories"][number]> })); return response(currentSubcategories[0]); });
    endpoint("DELETE", `/api/v1/subcategories/${subcategoryId}`, () => { currentSubcategories = []; return new Response(null, { status: 204 }); });
    endpoint("DELETE", `/api/v1/categories/${categoryId}`, () => { active = false; return new Response(null, { status: 204 }); });
    const user = userEvent.setup(); renderWithClient(<><CatalogProbe /><CategoriesAdmin /></>);
    expect(await screen.findByText("No hay categorías registradas.")).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Crear categoría" })[0]);
    await user.type(screen.getByLabelText("Código técnico"), "NEW_HARDWARE");
    await user.type(screen.getByLabelText("Nombre", { selector: "input" }), "Equipo audiovisual");
    await user.selectOptions(screen.getByLabelText("Área de soporte"), "NETWORKS");
    await user.selectOptions(screen.getByLabelText("Prioridad predeterminada"), "");
    await user.click(screen.getByRole("checkbox", { name: /Requiere información de software/ }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(categoryBody).toEqual({ code: "NEW_HARDWARE", name: "Equipo audiovisual", supportArea: "NETWORKS", defaultPriority: null, requiresSoftwareDetails: true }));
    expect(await screen.findByText("Equipo audiovisual")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Editar categoría Equipo audiovisual" }));
    const categoryName = screen.getByLabelText("Nombre", { selector: "input" });
    await user.clear(categoryName); await user.type(categoryName, "Ayuda audiovisual");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(categoryPatch).toEqual({ name: "Ayuda audiovisual" }));
    expect(categoryPatch).not.toHaveProperty("code");
    await user.click(screen.getByRole("button", { name: "Agregar subcategoría" }));
    await user.type(screen.getByLabelText("Código"), "PROJECTOR_FAILURE");
    await user.type(screen.getByLabelText("Nombre", { selector: "input" }), "Falla de proyector");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(subcategoryBody).toEqual({ code: "PROJECTOR_FAILURE", name: "Falla de proyector", priority: null }));
    expect(subcategoryBody).not.toHaveProperty("categoryId");
    expect(await screen.findByText("Falla de proyector")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Editar subcategoría Falla de proyector" }));
    const subcategoryName = screen.getByLabelText("Nombre", { selector: "input" });
    await user.clear(subcategoryName); await user.type(subcategoryName, "Falla audiovisual");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(subcategoryPatch).toEqual({ name: "Falla audiovisual" }));
    expect(subcategoryPatch).not.toHaveProperty("code"); expect(subcategoryPatch).not.toHaveProperty("categoryId");
    await user.click(screen.getByRole("button", { name: "Desactivar categoría Ayuda audiovisual" }));
    await user.click(screen.getByRole("button", { name: "Desactivar categoría" }));
    await waitFor(() => expect(active).toBe(false));
    expect(await screen.findByText("Inactiva")).toBeTruthy();
    expect(screen.getByText("Falla audiovisual")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Desactivar subcategoría Falla audiovisual" }));
    await user.click(screen.getByRole("button", { name: "Desactivar subcategoría" }));
    await waitFor(() => expect(requests.some((request) => request.method === "DELETE" && new URL(request.url).pathname.endsWith(subcategoryId))).toBe(true));
    await waitFor(() => expect(screen.queryByText("Falla audiovisual")).toBeNull());
    expect(catalogCalls).toBeGreaterThanOrEqual(2);
    expect(requests.some((request) => request.method === "DELETE" && new URL(request.url).pathname.endsWith(categoryId))).toBe(true);
  });
});

describe("ADMIN support member screens", () => {
  it("preprovisions SUPPORT with allowed role options, areas and skills and sends no password", async () => {
    let body: unknown;
    endpoint("POST", "/api/v1/support-members", async (request) => { body = await request.json(); return response({ ...member, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }, 201); });
    const user = userEvent.setup(); renderWithClient(<SupportMemberForm />);
    await user.type(screen.getByLabelText("Nombre completo"), "Técnica Ejemplo");
    await user.type(screen.getByLabelText("Correo institucional"), "tecnica@example.edu");
    await user.type(screen.getByLabelText("Matrícula o número institucional"), "A-123");
    const role = screen.getByLabelText("Rol del sistema");
    expect(Array.from((role as HTMLSelectElement).options).map((option) => option.value)).toEqual(["SUPPORT", "SUB_MANAGER"]);
    await user.selectOptions(role, "SUB_MANAGER");
    await user.click(screen.getByLabelText("Hardware"));
    await user.type(screen.getByLabelText("Nueva habilidad"), "Mantenimiento");
    await user.click(screen.getByRole("button", { name: "Agregar habilidad" }));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/admin/support-members/${memberId}`));
    expect(body).toEqual({ fullName: "Técnica Ejemplo", email: "tecnica@example.edu", institutionalId: "A-123", role: "SUB_MANAGER", supportAreas: ["HARDWARE"], skills: ["Mantenimiento"] });
    expect(body).not.toHaveProperty("password");
  });

  it("retains preprovision fields and shows the real duplicate-account conflict", async () => {
    endpoint("POST", "/api/v1/support-members", () => new Response(JSON.stringify({ success: false, error: { code: "SUPPORT_MEMBER_EMAIL_EXISTS", message: "El correo ya pertenece a una cuenta." }, requestId: "duplicate-support-request" }), { status: 409, headers: { "content-type": "application/json" } }));
    const user = userEvent.setup(); renderWithClient(<SupportMemberForm />);
    await user.type(screen.getByLabelText("Nombre completo"), "Técnica Existente");
    await user.type(screen.getByLabelText("Correo institucional"), "tecnica@example.edu");
    await user.type(screen.getByLabelText("Matrícula o número institucional"), "A-123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByText("El correo o identificador institucional ya está registrado")).toBeTruthy();
    expect(screen.getByText("Solicitud: duplicate-support-request")).toBeTruthy();
    expect(screen.getByDisplayValue("Técnica Existente")).toBeTruthy();
  });

  it("edits only dirty support-member fields and leaves email/institutional identity read-only", async () => {
    let body: unknown;
    const detail = { ...member, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" };
    endpoint("PATCH", `/api/v1/support-members/${memberId}`, async (request) => { body = await request.json(); return response({ ...detail, role: "SUB_MANAGER" }); });
    const user = userEvent.setup(); renderWithClient(<SupportMemberForm member={detail} />);
    expect((screen.getByLabelText("Correo institucional") as HTMLInputElement).readOnly).toBe(true);
    expect((screen.getByLabelText("Matrícula o número institucional") as HTMLInputElement).readOnly).toBe(true);
    expect(screen.queryByLabelText("Tipo de comunidad")).toBeNull();
    await user.selectOptions(screen.getByLabelText("Rol del sistema"), "SUB_MANAGER");
    await user.click(screen.getByLabelText("Hardware"));
    await user.click(screen.getByLabelText("Software"));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(body).toEqual({ role: "SUB_MANAGER", supportAreas: [] }));
    expect(body).not.toHaveProperty("email");
    expect(push).toHaveBeenCalledWith(`/admin/support-members/${memberId}`);
  });

  it("passes server filters and preserves them when moving through backend pagination", async () => {
    endpoint("GET", "/api/v1/support-members", (request) => {
      const search = new URL(request.url).searchParams;
      expect(search.get("role")).toBe("SUPPORT"); expect(search.get("supportArea")).toBe("HARDWARE"); expect(search.get("active")).toBe("false"); expect(search.get("page")).toBe("2");
      return response([{ ...member, isActive: false }], 200, { page: 2, pageSize: 10, total: 11, totalPages: 2 });
    });
    renderWithClient(<SupportMemberList filters={{ role: "SUPPORT", supportArea: "HARDWARE", active: "false", page: 2, pageSize: 10 }} />);
    expect(await screen.findByText("Página 2 de 2 · 11 integrantes")).toBeTruthy();
    expect(screen.getAllByText("Inactivo").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Anterior" }).getAttribute("href")).toContain("role=SUPPORT");
  });

  it("keeps an active member visible after the backend rejects deactivation for assigned active tickets", async () => {
    const detail = { ...member, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" };
    endpoint("GET", `/api/v1/support-members/${memberId}`, () => response(detail));
    endpoint("DELETE", `/api/v1/support-members/${memberId}`, () => new Response(JSON.stringify({ success: false, error: { code: "SUPPORT_MEMBER_HAS_ACTIVE_TICKETS", message: "El integrante tiene tickets activos asignados." }, requestId: "support-test-request" }), { status: 409, headers: { "content-type": "application/json" } }));
    const user = userEvent.setup(); renderWithClient(<SupportMemberDetail id={memberId} />);
    expect(await screen.findByText("Técnica Ejemplo")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Desactivar integrante" }));
    const confirmations = screen.getAllByRole("button", { name: "Desactivar integrante" });
    await user.click(confirmations[confirmations.length - 1]);
    expect(await screen.findByText("El integrante tiene tickets activos asignados.")).toBeTruthy();
    expect(screen.getByText("Solicitud: support-test-request")).toBeTruthy();
    expect(screen.getByText("Activo")).toBeTruthy();
  });

  it("reactivates by PATCH isActive only because the contract permits it", async () => {
    let active = false; let patchBody: unknown;
    const getDetail = () => response({ ...member, isActive: active, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" });
    endpoint("GET", `/api/v1/support-members/${memberId}`, getDetail);
    endpoint("PATCH", `/api/v1/support-members/${memberId}`, async (request) => { patchBody = await request.json(); active = true; return getDetail(); });
    const user = userEvent.setup(); renderWithClient(<SupportMemberDetail id={memberId} />);
    expect(await screen.findByText("Inactivo")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Reactivar" }));
    await waitFor(() => expect(patchBody).toEqual({ isActive: true }));
    expect(await screen.findByText("Activo")).toBeTruthy();
  });
});
