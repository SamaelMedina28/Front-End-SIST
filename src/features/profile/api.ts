import { ApiError } from "@/lib/api/api-error";
import { getBrowserClient } from "@/lib/api/browser-client";
import { requestApi } from "@/lib/api/request";
import type { components } from "@/types/api.generated";

export type UpdateUserProfileInput = components["schemas"]["UpdateUserProfileInput"];
export type UserProfile = components["schemas"]["User"];

export async function updateUserProfile(body: UpdateUserProfileInput): Promise<UserProfile> {
  const data = await requestApi(() => getBrowserClient().PATCH("/api/v1/users/me", { body }));
  if (!data || typeof data.id !== "string") throw ApiError.unexpected();
  return data;
}
