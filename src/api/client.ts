/**
 * KindredBridge API Client
 * Centralized fetch wrapper for communicating with FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let authToken: string | null = localStorage.getItem("kb_auth_token");

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem("kb_auth_token", token);
  } else {
    localStorage.removeItem("kb_auth_token");
  }
};

export const getAuthToken = (): string | null => {
  return authToken || localStorage.getItem("kb_auth_token");
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorData: unknown;
    try {
      errorData = await response.json();
      if (
        typeof errorData === "object" &&
        errorData !== null &&
        "detail" in errorData
      ) {
        errorMessage = (errorData as { detail: string }).detail;
      }
    } catch {
      // Body is not JSON
    }
    throw new ApiError(response.status, errorMessage, errorData);
  }

  // If response is empty or 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
