import { API_BASE_URL } from "../../config/env";

export class ApiFetchError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
    this.data = data;
  }
}

export type ApiErrorShape = {
  status: number;
  message: string;
  data?: unknown;
};

export type ApiFetchOptions = RequestInit & {
  accessToken?: string | null;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  const { accessToken, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers ?? {});
  const hasFormData = typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
  const hasJsonBody = requestOptions.body != null && !hasFormData;

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, { ...requestOptions, headers });
  } catch {
    throw new ApiFetchError(0, "İnternet bağlantısı kurulamadı. Lütfen bağlantınızı kontrol edin.");
  }

  const rawBody = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const isJsonResponse = contentType.includes("application/json");
  const parsedBody = parseJsonSafe(rawBody);

  if (!response.ok) {
    const data = isJsonResponse ? parsedBody : rawBody;
    const message = safeErrorMessage(rawBody, response.status, isJsonResponse, url, data);
    throw new ApiFetchError(response.status, message, data);
  }

  if (response.status === 204 || rawBody.trim().length === 0) {
    return null as T;
  }

  if (!isJsonResponse) {
    return rawBody as unknown as T;
  }

  if (parsedBody == null) {
    throw new Error("Failed to parse JSON response from API.");
  }

  return parsedBody as T;
}

function parseJsonSafe(rawBody: string): unknown | null {
  if (!rawBody?.trim()) return null;
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

export function normalizeApiError(error: unknown): ApiErrorShape {
  if (error instanceof ApiFetchError) {
    return {
      status: error.status,
      message: error.message,
      data: error.data,
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      message: error.message,
    };
  }

  return {
    status: 0,
    message: "Beklenmeyen bir hata oluştu.",
  };
}

function safeErrorMessage(rawBody: string | undefined, status: number, isJson: boolean, url: string, data?: unknown): string {
  if (isJson && data && typeof data === "object") {
    const responseData = data as { message?: string; error?: string };
    if (typeof responseData.message === "string") return responseData.message;
    if (typeof responseData.error === "string") return responseData.error;
  }

  if (isJson && typeof data === "string") return data;

  if (status === 404) {
    return `Resource not found (404) for ${url}. Verify the path matches backend route definitions.`;
  }

  if (!rawBody) {
    return `Request failed with status ${status}`;
  }

  return `Request failed with status ${status}. Body: ${rawBody}`;
}
