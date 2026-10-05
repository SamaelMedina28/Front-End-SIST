import { ApiError, isRecord } from "@/lib/api/api-error";

export function apiFieldMessage(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError) || !isRecord(error.fields)) return undefined;
  const value = error.fields[field];
  return Array.isArray(value) && value.every((message): message is string => typeof message === "string")
    ? value.join(" ") || undefined
    : undefined;
}

export function apiRequestId(error: unknown) {
  return error instanceof ApiError ? error.requestId : undefined;
}
