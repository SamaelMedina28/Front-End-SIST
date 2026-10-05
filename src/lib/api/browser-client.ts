import createClient from "openapi-fetch";

import { getPublicEnvironment } from "@/lib/env";
import type { paths } from "@/types/api.generated";

function buildBrowserClient() {
  const { NEXT_PUBLIC_API_URL } = getPublicEnvironment();
  // The OpenAPI document already includes /api/v1 in each path.
  const baseUrl = new URL(NEXT_PUBLIC_API_URL).origin;

  return createClient<paths>({
    baseUrl,
    credentials: "include",
  });
}

let browserClient: ReturnType<typeof buildBrowserClient> | undefined;

/** Return the shared, typed browser client without requiring env at import time. */
export function getBrowserClient() {
  browserClient ??= buildBrowserClient();
  return browserClient;
}
