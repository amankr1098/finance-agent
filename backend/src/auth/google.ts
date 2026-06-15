import { google } from "googleapis";
import "dotenv/config";
import { getRefreshToken } from "../db/users.js";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

function getRedirectUri(): string {
  const backend = process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
  return `${backend.replace(/\/$/, "")}/auth/google/callback`;
}

/**
 * Builds a bare OAuth2 client with the redirect URI configured. Used during
 * the consent flow (`/auth/google` and `/auth/google/callback`).
 */
export function getOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
}

/**
 * Builds an OAuth2 client for a specific refresh token.
 */
export function getAuthClientForToken(refreshToken: string): OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

/**
 * Loads the user's refresh token from Firestore and returns an OAuth2 client
 * bound to it. Throws if the user has not connected their Google account yet.
 */
export async function getAuthClientForUser(uid: string): Promise<OAuth2Client> {
  const refreshToken = await getRefreshToken(uid);
  if (!refreshToken) {
    throw new Error(`User ${uid} has not connected a Google account.`);
  }
  return getAuthClientForToken(refreshToken);
}

/**
 * Legacy single-user client backed by GOOGLE_REFRESH_TOKEN in .env.
 * Kept so the existing pollEmails / gmail / sheet modules keep working
 * until they are migrated to per-user clients.
 *
 * @deprecated Use {@link getAuthClientForUser} once the multi-tenant refactor lands.
 */
export function getAuthClient(): OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? null,
  });
  return client;
}