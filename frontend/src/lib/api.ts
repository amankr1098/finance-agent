import { auth } from "./firebase";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/**
 * URL the user is sent to in order to start the Google OAuth consent flow.
 * The backend redirects to Google, then back to `/auth/callback?token=...`
 * on the frontend with a Firebase custom token.
 */
export const GOOGLE_OAUTH_START_URL = `${API_BASE_URL.replace(/\/$/, "")}/auth/google`;

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * fetch wrapper that prefixes the API base URL and attaches the current
 * user's Firebase ID token as a Bearer token when available.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const user = auth.currentUser;
  if (user) {
    const idToken = await user.getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  const url = `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers });

  const text = await res.text();
  let parsed: unknown = text;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // leave as text
    }
  }

  if (!res.ok) {
    const msg =
      (typeof parsed === "object" && parsed !== null && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : res.statusText) || `Request failed (${res.status})`;
    throw new ApiError(res.status, msg, parsed);
  }

  return parsed as T;
}
