export type ApiErrorKind = "http" | "network" | "unexpected";

export interface ApiErrorOptions {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  code?: string;
  fields?: unknown;
  requestId?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly fields: unknown;
  readonly requestId: string | undefined;
  override readonly cause: unknown;

  constructor({ kind, message, status, code, fields, requestId, cause }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.requestId = requestId;
    this.cause = cause;
  }

  static network(cause?: unknown): ApiError {
    return new ApiError({
      kind: "network",
      message: "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
      cause,
    });
  }

  static unexpected(status?: number, cause?: unknown): ApiError {
    return new ApiError({
      kind: "unexpected",
      message: "El servidor devolvió una respuesta inesperada. Inténtalo de nuevo.",
      status,
      cause,
    });
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function apiErrorFromPayload(payload: unknown, status: number): ApiError {
  const root = isRecord(payload) ? payload : undefined;
  const error = root && isRecord(root.error) ? root.error : undefined;
  const code = error && typeof error.code === "string" ? error.code : undefined;
  const message = error && typeof error.message === "string" && error.message.trim().length > 0
    ? error.message
    : `La solicitud no pudo completarse (HTTP ${status}).`;
  const requestId = root && typeof root.requestId === "string" ? root.requestId : undefined;

  return new ApiError({
    kind: "http",
    message,
    status,
    code,
    fields: error?.fields,
    requestId,
  });
}

export function normalizeRequestError(error: unknown): Error {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === "AbortError") return error;
  if (error instanceof TypeError) return ApiError.network(error);
  return ApiError.unexpected(undefined, error);
}
