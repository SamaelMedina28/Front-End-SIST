import { normalizeRequestError } from "./api-error";
import { unwrapEnvelope, unwrapResponse, type ApiFetchResult, type ApiSuccessEnvelope } from "./unwrap-response";

export async function requestApi<Data>(request: () => Promise<ApiFetchResult<Data>>): Promise<Data | undefined> {
  try {
    return unwrapResponse(await request());
  } catch (error) {
    throw normalizeRequestError(error);
  }
}

/** Keeps response metadata (for example, backend pagination) while applying the shared envelope checks. */
export async function requestApiEnvelope<Data, Meta = unknown>(request: () => Promise<ApiFetchResult<Data, Meta>>): Promise<ApiSuccessEnvelope<Data, Meta>> {
  try {
    return unwrapEnvelope(await request());
  } catch (error) {
    throw normalizeRequestError(error);
  }
}
