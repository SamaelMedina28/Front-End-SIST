import { describe, expect, it } from "vitest";

import { ApiError, apiErrorFromPayload } from "../src/lib/api/api-error";
import { shouldRetryQuery } from "../src/lib/api/query-retry";
import { requestApi } from "../src/lib/api/request";
import { unwrapResponse, type ApiFetchResult } from "../src/lib/api/unwrap-response";
import { getPublicEnvironment } from "../src/lib/env";

function response(status: number): Response {
  return new Response(null, { status });
}

describe("API response normalization", () => {
  it("preserves backend error fields, requestId, status, code, and message", () => {
    const error = apiErrorFromPayload({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Revisa los campos indicados.",
        fields: { title: ["Es obligatorio."] },
      },
      requestId: "req-42",
    }, 422);

    expect(error).toMatchObject({
      kind: "http",
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Revisa los campos indicados.",
      fields: { title: ["Es obligatorio."] },
      requestId: "req-42",
    });
    expect(error).toBeInstanceOf(ApiError);
  });

  it("uses a controlled message when an HTTP error body is unexpected", () => {
    const error = apiErrorFromPayload("not JSON", 503);
    expect(error.message).toContain("HTTP 503");
    expect(error.status).toBe(503);
    expect(error.kind).toBe("http");
  });

  it("turns an HTTP error response into ApiError", () => {
    const result: ApiFetchResult<{ id: string }> = {
      error: {
        success: false,
        error: { code: "NOT_FOUND", message: "No existe." },
        requestId: "req-404",
      },
      response: response(404),
    };

    expect(() => unwrapResponse(result)).toThrowError(expect.objectContaining({
      status: 404,
      code: "NOT_FOUND",
      requestId: "req-404",
      message: "No existe.",
    }));
  });

  it("unwraps a successful backend envelope", () => {
    const result: ApiFetchResult<{ id: string }> = {
      data: { success: true, data: { id: "ticket-1" }, meta: { page: 1 } },
      response: response(200),
    };

    expect(unwrapResponse(result)).toEqual({ id: "ticket-1" });
  });

  it("accepts an empty 204 response", () => {
    const result: ApiFetchResult<never> = { response: response(204) };
    expect(unwrapResponse(result)).toBeUndefined();
  });

  it("classifies an absent body on a successful response as unexpected", () => {
    const result: ApiFetchResult<{ value: string }> = { response: response(200) };
    expect(() => unwrapResponse(result)).toThrowError(ApiError);
    expect(() => unwrapResponse(result)).toThrow("respuesta inesperada");
  });

  it("classifies fetch failures as network errors and preserves the cause", async () => {
    const networkFailure = new TypeError("Failed to fetch");
    const request = requestApi(() => Promise.reject(networkFailure));

    await expect(request).rejects.toMatchObject({
      kind: "network",
      message: "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
      cause: networkFailure,
    });
  });

  it("classifies parsing or other unexpected thrown errors consistently", async () => {
    await expect(requestApi(() => Promise.reject(new SyntaxError("invalid JSON"))))
      .rejects.toMatchObject({ kind: "unexpected" });
  });
});

describe("query retry policy", () => {
  it("retries one time for network failures and server errors", () => {
    expect(shouldRetryQuery(0, ApiError.network())).toBe(true);
    expect(shouldRetryQuery(0, apiErrorFromPayload(undefined, 503))).toBe(true);
    expect(shouldRetryQuery(1, ApiError.network())).toBe(false);
  });

  it("does not retry client errors or unknown failures", () => {
    expect(shouldRetryQuery(0, apiErrorFromPayload(undefined, 401))).toBe(false);
    expect(shouldRetryQuery(0, apiErrorFromPayload(undefined, 422))).toBe(false);
    expect(shouldRetryQuery(0, new Error("unknown"))).toBe(false);
  });
});

describe("public environment", () => {
  it("validates the API prefix and the separate backend origin", () => {
    expect(getPublicEnvironment({
      NEXT_PUBLIC_API_URL: "http://localhost:3000/api/v1",
      NEXT_PUBLIC_BACKEND_URL: "http://localhost:3000",
    })).toEqual({
      NEXT_PUBLIC_API_URL: "http://localhost:3000/api/v1",
      NEXT_PUBLIC_BACKEND_URL: "http://localhost:3000",
    });
  });

  it("rejects missing values and incorrectly scoped URLs", () => {
    expect(() => getPublicEnvironment({
      NEXT_PUBLIC_API_URL: "http://localhost:3000",
      NEXT_PUBLIC_BACKEND_URL: "",
    })).toThrow("Configuración pública inválida");
  });
});
