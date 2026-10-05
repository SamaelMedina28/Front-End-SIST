// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthGuard, SessionGate } from "../src/features/auth/components/session-gate";
import { CompleteProfileForm } from "../src/features/auth/components/complete-profile-form";
import { GoogleLoginButton } from "../src/features/auth/components/google-login-button";
import { currentUserKey } from "../src/features/auth/queries/current-user";
import { Topbar } from "../src/components/layout/topbar";
import { UserAvatar } from "../src/features/auth/components/user-avatar";
import { errorResponse, jsonResponse, testUser } from "./auth-fixture";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), usePathname: () => "/dashboard" }));
const fetchMock = vi.fn<typeof fetch>();
// Node's Request requires its own AbortSignal, rather than JSDOM's realm.
const NativeAbortController = transferableAbortController().constructor;
const clients: QueryClient[] = [];

function renderAuth(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  clients.push(client);
  const result = render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
  return { ...result, client };
}

beforeEach(() => {
  replace.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("AbortController", NativeAbortController);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api/v1");
  vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000");
});
afterEach(() => { cleanup(); clients.splice(0).forEach((client) => client.clear()); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("session route decisions", () => {
  it("hides protected content while /me is loading", () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    renderAuth(<AuthGuard><p>Contenido protegido</p></AuthGuard>);
    expect(screen.getByRole("status", { name: "Verificando sesión" })).toBeTruthy();
    expect(screen.queryByText("Contenido protegido")).toBeNull();
  });

  it("renders authenticated children and real topbar data", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ success: true, data: testUser }));
    renderAuth(<AuthGuard><p>Contenido protegido</p></AuthGuard>);
    expect(await screen.findByText("Contenido protegido")).toBeTruthy();
    expect(screen.getByText(testUser.fullName)).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects a protected 401 without exposing children", async () => {
    fetchMock.mockImplementation(async () => errorResponse(401));
    renderAuth(<AuthGuard><p>Contenido protegido</p></AuthGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Contenido protegido")).toBeNull();
  });

  it("shows a retry for 5xx without redirecting, then renders a recovered session", async () => {
    fetchMock.mockImplementation(async () => errorResponse(503));
    renderAuth(<AuthGuard><p>Contenido protegido</p></AuthGuard>);
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Solicitud: test-request")).toBeTruthy();
    fetchMock.mockImplementation(async () => jsonResponse({ success: true, data: testUser }));
    await userEvent.click(retry);
    expect(await screen.findByText("Contenido protegido")).toBeTruthy();
  });

  it("does not turn a network error into an unauthenticated redirect", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    renderAuth(<SessionGate mode="login"><GoogleLoginButton /></SessionGate>);
    expect(await screen.findByRole("button", { name: "Reintentar" })).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Continuar con Google" })).toBeNull();
  });

  it("hides stale protected content when a background session refresh returns 401", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ success: true, data: testUser }));
    const { client } = renderAuth(<AuthGuard><p>Contenido protegido</p></AuthGuard>);
    await screen.findByText("Contenido protegido");
    fetchMock.mockImplementation(async () => errorResponse(401));
    await act(async () => { await client.invalidateQueries({ queryKey: currentUserKey }); });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Contenido protegido")).toBeNull();
  });

  it.each(["login", "onboarding", "success"] as const)("redirects authenticated %s to dashboard", async (mode) => {
    fetchMock.mockImplementation(async () => jsonResponse({ success: true, data: testUser }));
    renderAuth(<SessionGate mode={mode}><p>Formulario público</p></SessionGate>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText("Formulario público")).toBeNull();
  });

  it("redirects success with a missing session to login", async () => {
    fetchMock.mockImplementation(async () => errorResponse(401));
    renderAuth(<SessionGate mode="success" />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("allows onboarding after /me returns 401", async () => {
    fetchMock.mockImplementation(async () => errorResponse(401));
    renderAuth(<SessionGate mode="onboarding"><CompleteProfileForm /></SessionGate>);
    expect(await screen.findByLabelText(/Matrícula/)).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("offers Google after login's /me returns 401", async () => {
    fetchMock.mockImplementation(async () => errorResponse(401));
    renderAuth(<SessionGate mode="login"><GoogleLoginButton /></SessionGate>);
    expect(await screen.findByRole("button", { name: "Continuar con Google" })).toBeTruthy();
  });
});

async function fillProfile() {
  await userEvent.type(screen.getByLabelText(/Matrícula/), "TEST");
  await userEvent.selectOptions(screen.getByLabelText(/Comunidad universitaria/), "STUDENT");
}

describe("onboarding form", () => {
  it("keeps values and maps backend fields to accessible inline errors", async () => {
    fetchMock.mockImplementation(async () => errorResponse(422, "VALIDATION_ERROR", { institutionalId: ["Identificador no disponible"] }));
    renderAuth(<CompleteProfileForm />);
    await fillProfile();
    await userEvent.click(screen.getByRole("button", { name: "Completar registro" }));
    expect(await screen.findByText("Identificador no disponible")).toBeTruthy();
    expect(screen.getByLabelText(/Matrícula/).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByDisplayValue("TEST")).toBeTruthy();
    expect(screen.getByText("Solicitud: test-request")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText(/Matrícula/));
  });

  it("offers login for ONBOARDING_REQUIRED", async () => {
    fetchMock.mockImplementation(async () => errorResponse(401, "ONBOARDING_REQUIRED"));
    renderAuth(<CompleteProfileForm />);
    await fillProfile();
    await userEvent.click(screen.getByRole("button", { name: "Completar registro" }));
    expect((await screen.findByRole("link", { name: "Volver a iniciar sesión" })).getAttribute("href")).toBe("/login");
    expect(screen.getByText("La sesión para completar tu registro ya no es válida. Inicia sesión nuevamente.")).toBeTruthy();
  });

  it("prevents concurrent POSTs and confirms session on the callback route after success", async () => {
    let finish: (response: Response) => void = () => {};
    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve; }));
    const { client } = renderAuth(<CompleteProfileForm />);
    client.setQueryData(currentUserKey, null);
    await fillProfile();
    const form = screen.getByRole("button", { name: "Completar registro" }).closest("form");
    if (!form) throw new Error("Missing form");
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Guardando…" }).hasAttribute("disabled")).toBe(true);
    await act(async () => { finish(jsonResponse({ success: true, data: testUser }, 201)); });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth/success"));
    expect(client.getQueryState(currentUserKey)?.isInvalidated).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("logout and avatar", () => {
  it("clears private data after logout and navigates to login", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { client } = renderAuth(<Topbar user={testUser} onMenuClick={() => {}} />);
    client.setQueryData(currentUserKey, testUser);
    client.setQueryData(["private"], "test data");
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(client.getQueryData(currentUserKey)).toBeNull();
    expect(client.getQueryData(["private"])).toBeUndefined();
  });

  it("keeps session data on failed logout and shows a retry", async () => {
    fetchMock.mockImplementation(async () => errorResponse(503));
    const { client } = renderAuth(<Topbar user={testUser} onMenuClick={() => {}} />);
    client.setQueryData(currentUserKey, testUser);
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("button", { name: "Reintentar" })).toBeTruthy();
    expect(client.getQueryData(currentUserKey)).toEqual(testUser);
    expect(replace).not.toHaveBeenCalled();
  });

  it("falls back to initials for unsafe URLs and image errors", () => {
    const { rerender } = render(<UserAvatar user={{ ...testUser, avatarUrl: "javascript:void(0)" }} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("PD")).toBeTruthy();
    rerender(<UserAvatar user={{ ...testUser, avatarUrl: "https://example.invalid/avatar.png" }} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("PD")).toBeTruthy();
  });
});
