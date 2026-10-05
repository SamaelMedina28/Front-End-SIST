import { ApiError, apiErrorFromPayload, isRecord } from "./api-error";

export interface ApiSuccessEnvelope<Data> {
  success: true;
  data: Data;
  meta?: unknown;
}

export interface ApiFetchResult<Data> {
  data?: ApiSuccessEnvelope<Data>;
  error?: unknown;
  response: Response;
}

function isSuccessEnvelope<Data>(payload: unknown): payload is ApiSuccessEnvelope<Data> {
  return isRecord(payload) && payload.success === true && "data" in payload;
}

export function unwrapResponse<Data>({ data, error, response }: ApiFetchResult<Data>): Data | undefined {
  if (!response.ok) {
    throw apiErrorFromPayload(error, response.status);
  }

  if (response.status === 204) return undefined;

  if (data === undefined) {
    throw ApiError.unexpected(response.status);
  }

  const payload: unknown = data;
  if (isRecord(payload) && payload.success === false) {
    throw apiErrorFromPayload(payload, response.status);
  }

  if (!isSuccessEnvelope<Data>(payload)) {
    throw ApiError.unexpected(response.status);
  }

  return payload.data;
}
