import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { completeProfile, fetchCurrentUser, googleLoginUrl, logout } from "../src/features/auth/api";
import { currentUserKey, currentUserOptions } from "../src/features/auth/queries/current-user";
import { clearSessionCache } from "../src/features/auth/mutations/session";
import { completeProfileSchema, profileRequest } from "../src/features/auth/schemas/complete-profile";
import { ApiError } from "../src/lib/api/api-error";
import { errorResponse, jsonResponse, testUser } from "./auth-fixture";

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api/v1");
  vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:3000");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function lastRequest() {
  const input = fetchMock.mock.calls.at(-1)?.[0];
  if (!(input instanceof Request)) throw new Error("Expected the HTTP client's Request");
  return input;
}

describe("auth HTTP contract", () => {
  it("builds a full browser navigation URL, without an HTTP request", () => {
    expect(googleLoginUrl()).toBe("http://localhost:3000/api/v1/auth/google");
    expect(googleLoginUrl("https://api.example.invalid/")).toBe("https://api.example.invalid/api/v1/auth/google");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads /me with credentials and forwards cancellation", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: testUser }));
    const controller = new AbortController();
    expect(await fetchCurrentUser(controller.signal)).toEqual(testUser);
    expect(lastRequest().url).toBe("http://localhost:3000/api/v1/auth/me");
    expect(lastRequest().credentials).toBe("include");
    controller.abort();
    expect(lastRequest().signal.aborted).toBe(true);
  });

  it("configures a shared auth key and retry without polling", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: testUser }));
    const client = new QueryClient();
    const options = currentUserOptions();
    expect(options.queryKey).toEqual(["auth", "me"]);
    expect(options.refetchOnWindowFocus).toBe(true);
    expect(options.refetchInterval).toBeUndefined();
    expect(options.retry).toBeTypeOf("function");
    expect(await client.fetchQuery(options)).toEqual(testUser);
    expect(client.getQueryData(currentUserKey)).toEqual(testUser);
    client.clear();
  });

  it("sends only the generated onboarding fields, preserving the real enum and optional phone", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: testUser }, 201));
    const parsed = completeProfileSchema.parse({ institutionalId: "  TEST  ", communityType: "STUDENT", phone: "" });
    await completeProfile(profileRequest(parsed));
    expect(lastRequest().method).toBe("POST");
    expect(lastRequest().credentials).toBe("include");
    expect(await lastRequest().json()).toEqual({ institutionalId: "TEST", communityType: "STUDENT", phone: null });
    expect(completeProfileSchema.safeParse({ institutionalId: "", communityType: "Estudiante", phone: "" }).success).toBe(false);
  });

  it("preserves onboarding API errors for inline rendering", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(422, "VALIDATION_ERROR", { phone: ["Revisa el teléfono."] }));
    await expect(completeProfile({ institutionalId: "TEST", communityType: "TEACHER" })).rejects.toMatchObject({
      status: 422, fields: { phone: ["Revisa el teléfono."] }, requestId: "test-request",
    });
  });

  it("rejects empty successful /me responses instead of treating them as a session", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(fetchCurrentUser()).rejects.toBeInstanceOf(ApiError);
  });

  it("logs out via POST/204 and treats an expired 401 as already signed out", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await logout();
    expect(lastRequest().method).toBe("POST");
    expect(lastRequest().url).toBe("http://localhost:3000/api/v1/auth/logout");
    fetchMock.mockResolvedValueOnce(errorResponse(401));
    await expect(logout()).resolves.toBeUndefined();
    fetchMock.mockResolvedValueOnce(errorResponse(503));
    await expect(logout()).rejects.toMatchObject({ status: 503 });
  });

  it("cancels pending data, removes private caches, and leaves auth explicitly empty on logout", async () => {
    const client = new QueryClient();
    client.setQueryData(currentUserKey, testUser);
    client.setQueryData(["private", "cached"], { value: "test-only" });
    let resolveLate: (value: string) => void = () => {};
    const late = client.fetchQuery({ queryKey: ["private", "pending"], queryFn: () => new Promise<string>((resolve) => { resolveLate = resolve; }) }).catch(() => undefined);
    await clearSessionCache(client);
    resolveLate("late response");
    await late;
    expect(client.getQueryData(currentUserKey)).toBeNull();
    expect(client.getQueryData(["private", "cached"])).toBeUndefined();
    expect(client.getQueryData(["private", "pending"])).toBeUndefined();
    client.clear();
  });
});
