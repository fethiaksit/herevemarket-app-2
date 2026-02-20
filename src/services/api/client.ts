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

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers ?? {});
  const hasFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const hasJsonBody = options.body != null && !hasFormData;
  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const url = `${API_BASE_URL}${path}`;

  console.log("[apiFetch] request started", {
    url,
    method: options.method ?? "GET",
  });

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    console.error("[apiFetch] network error", { url, err });
    throw new Error("Network request failed. Check connectivity or DNS resolution.");
  }

  const rawBody = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const isJsonResponse = contentType.includes("application/json");

  if (!response.ok) {
    let data: unknown = null;
    if (isJsonResponse && rawBody?.trim()) {
      try {
        data = JSON.parse(rawBody);
      } catch (parseError) {
        console.warn("[apiFetch] failed to parse error body as JSON", { url, parseError });
      }
    }

    const message = safeErrorMessage(rawBody, response.status, isJsonResponse, url, data);
    console.error("[apiFetch] request failed", {
      status: response.status,
      statusText: response.statusText,
      url,
      contentType,
      message,
      data,
      rawBody: isJsonResponse ? undefined : rawBody,
    });
    throw new ApiFetchError(response.status, message, data);
  }

  if (response.status === 204 || rawBody.trim().length === 0) {
    return null as T;
  }

  if (!isJsonResponse) {
    console.warn("[apiFetch] non-JSON success response", { url, contentType });
    return rawBody as unknown as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch (parseError) {
    console.error("[apiFetch] failed to parse JSON response", { url, parseError });
    console.log("[apiFetch] raw body:", rawBody);
    throw new Error("Failed to parse JSON response from API.");
  }
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
