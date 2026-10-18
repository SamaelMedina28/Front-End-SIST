import type { CurrentUser } from "../src/features/auth/api";

// Synthetic fixture only: never sent to the backend or shipped in the app.
export const testUser: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "auth-test@example.invalid",
  fullName: "Persona de prueba",
  institutionalId: "TEST",
  phone: null,
  role: "USER",
  supportAreas: [],
  skills: [],
  avatarUrl: null,
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export function errorResponse(status: number, code = "TEST_ERROR", fields?: Record<string, string[]>) {
  return jsonResponse({ success: false, error: { code, message: "Mensaje del servidor", fields }, requestId: "test-request" }, status);
}
