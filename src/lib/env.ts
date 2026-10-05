import { z } from "zod";

function hasUrlPath(value: string, path: string, trimTrailingSlash = false): boolean {
  try {
    const pathname = new URL(value).pathname;
    return (trimTrailingSlash ? pathname.replace(/\/$/, "") : pathname) === path;
  } catch {
    return false;
  }
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().refine(
    (value) => hasUrlPath(value, "/api/v1", true),
    "NEXT_PUBLIC_API_URL debe apuntar al prefijo /api/v1",
  ),
  NEXT_PUBLIC_BACKEND_URL: z.string().url().refine(
    (value) => hasUrlPath(value, "/"),
    "NEXT_PUBLIC_BACKEND_URL debe ser el origen del backend, sin ruta",
  ),
});

export type PublicEnvironment = z.infer<typeof publicEnvSchema>;

export function getPublicEnvironment(
  values: Record<string, string | undefined> = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
): PublicEnvironment {
  const parsed = publicEnvSchema.safeParse(values);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Configuración pública inválida. Revisa las variables NEXT_PUBLIC_*:\n${issues.join("\n")}`);
  }

  return parsed.data;
}
