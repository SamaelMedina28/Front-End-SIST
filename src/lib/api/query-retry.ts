import { ApiError } from "./api-error";

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1 || !(error instanceof ApiError)) return false;
  if (error.kind === "network") return true;
  return error.kind === "http" && error.status !== undefined && error.status >= 500;
}
