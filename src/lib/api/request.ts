import { normalizeRequestError } from "./api-error";
import { unwrapResponse, type ApiFetchResult } from "./unwrap-response";

export async function requestApi<Data>(request: () => Promise<ApiFetchResult<Data>>): Promise<Data | undefined> {
  try {
    return unwrapResponse(await request());
  } catch (error) {
    throw normalizeRequestError(error);
  }
}
