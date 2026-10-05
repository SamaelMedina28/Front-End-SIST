import { ApiError, apiErrorFromPayload, isRecord } from "./api-error";

export interface ApiSuccessEnvelope<Data, Meta = unknown> {
  success: true;
  data: Data;
  meta?: Meta;
}

export interface ApiFetchResult<Data, Meta = unknown> {
  data?: ApiSuccessEnvelope<Data, Meta>;
  error?: unknown;
  response: Response;
}

function isSuccessEnvelope<Data, Meta = unknown>(payload: unknown): payload is ApiSuccessEnvelope<Data, Meta> {
  return isRecord(payload) && payload.success === true && "data" in payload;
}

export function unwrapEnvelope<Data, Meta = unknown>({ data, error, response }: ApiFetchResult<Data, Meta>): ApiSuccessEnvelope<Data, Meta> {
  if (!response.ok) {
    throw apiErrorFromPayload(error, response.status);
  }

  if (response.status === 204) throw ApiError.unexpected(response.status);

  if (data === undefined) {
    throw ApiError.unexpected(response.status);
  }

  const payload: unknown = data;
  if (isRecord(payload) && payload.success === false) {
    throw apiErrorFromPayload(payload, response.status);
  }

  if (!isSuccessEnvelope<Data, Meta>(payload)) {
    throw ApiError.unexpected(response.status);
  }

  return payload;
}

export function unwrapResponse<Data>({ data, error, response }: ApiFetchResult<Data>): Data | undefined {
  if (response.status === 204 && response.ok) return undefined;
  return unwrapEnvelope({ data, error, response }).data;
}
