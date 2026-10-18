import { ApiError } from "@/lib/api/api-error";
import { getBrowserClient } from "@/lib/api/browser-client";
import { requestApi } from "@/lib/api/request";
import { getPublicEnvironment } from "@/lib/env";
import type { components } from "@/types/api.generated";

export type CurrentUser = components["schemas"]["User"];
export type CompleteProfileInput = components["schemas"]["CompleteProfileInput"];

export function googleLoginUrl(backendUrl = getPublicEnvironment().NEXT_PUBLIC_BACKEND_URL) {
  return new URL("/api/v1/auth/google", backendUrl).href;
}

export async function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const user = await requestApi(() => getBrowserClient().GET("/api/v1/auth/me", { signal }));
  if (!user || typeof user.id !== "string" || typeof user.fullName !== "string") {
    throw ApiError.unexpected();
  }
  return user;
}

export async function completeProfile(body: CompleteProfileInput): Promise<void> {
  await requestApi(() => getBrowserClient().POST("/api/v1/auth/complete-profile", { body }));
}

export async function logout(): Promise<void> {
  try {
    await requestApi(() => getBrowserClient().POST("/api/v1/auth/logout"));
  } catch (error) {
    // An already expired normal session is also safe to remove from memory.
    if (!(error instanceof ApiError && error.status === 401)) throw error;
  }
}
