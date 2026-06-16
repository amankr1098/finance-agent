import axios from "axios";
import { auth } from "./firebase";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/**
 * URL the user is sent to in order to start the Google OAuth consent flow.
 * The backend redirects to Google, then back to `/auth/callback?token=...`
 * on the frontend with a Firebase custom token.
 */
export const GOOGLE_OAUTH_START_URL = `${API_BASE_URL.replace(/\/$/, "")}/auth/google`;

// ---------------------------------------------------------------------------
// Axios instance with automatic Firebase Bearer-token injection
// ---------------------------------------------------------------------------
export const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const idToken = await user.getIdToken();
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------
export interface PollStatus {
  lastPolledAt: { _seconds: number; _nanoseconds: number } | null;
  isPolling: boolean;
  totalEmailsProcessed: number;
  financeEmailsFound: number;
  error?: string | null;
}

export interface PollEmailsResponse {
  success: boolean;
  firstPoll: boolean;
  totalEmailsProcessed: number;
  financeEmailsFound: number;
}

export interface FinanceEmail {
  emailId: string;
  subject: string;
  from: string;
  category: string;
  processedAt: { _seconds: number } | null;
}

export interface ExtractedExpense {
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  isRecurring: boolean;
  notes: string;
}

export interface Expense {
  emailId: string;
  subject: string;
  from: string;
  category: string;
  extractedResults: ExtractedExpense | null;
  savedAt: { _seconds: number } | null;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------
export async function getPollStatus(): Promise<{ pollStatus: PollStatus | null }> {
  const { data } = await api.get<{ pollStatus: PollStatus | null }>("/api/poll-status");
  return data;
}

export async function triggerPollEmails(): Promise<PollEmailsResponse> {
  const { data } = await api.post<PollEmailsResponse>("/api/poll-emails");
  return data;
}

export async function getFinanceEmails(): Promise<{ financeEmails: FinanceEmail[] }> {
  const { data } = await api.get<{ financeEmails: FinanceEmail[] }>("/api/finance-emails");
  return data;
}

export async function getExpenses(): Promise<{ expenses: Expense[] }> {
  const { data } = await api.get<{ expenses: Expense[] }>("/api/expenses");
  return data;
}

// ---------------------------------------------------------------------------
// Legacy fetch wrapper (kept for existing callers)
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

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

