import { Router, type Request, type Response } from "express";
import { google } from "googleapis";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { GOOGLE_SCOPES, getOAuthClient } from "./google.js";
import { upsertUser } from "../db/users.js";
import { adminAuth } from "../db/firebase.js";

const router: Router = Router();

/**
 * Signs a short opaque value (e.g. a nonce) with APP_SECRET so we can validate
 * that the `state` round-tripped by Google was actually issued by us.
 */
function signState(nonce: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET is required");
  const sig = createHmac("sha256", secret).update(nonce).digest("base64url");
  return `${nonce}.${sig}`;
}

function verifyState(state: string | undefined): boolean {
  if (!state) return false;
  const dot = state.lastIndexOf(".");
  if (dot < 0) return false;
  const nonce = state.slice(0, dot);
  const provided = state.slice(dot + 1);
  const expected = createHmac("sha256", process.env.APP_SECRET ?? "").update(nonce).digest("base64url");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * GET /auth/google
 * Starts the OAuth consent flow and redirects the user to Google.
 */
router.get("/auth/google", (_req: Request, res: Response) => {
  const client = getOAuthClient();
  const state = signState(randomBytes(16).toString("hex"));
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force refresh_token issuance every time
    scope: GOOGLE_SCOPES,
    include_granted_scopes: true,
    state,
  });
  res.redirect(url);
});

/**
 * GET /auth/google/callback
 * Exchanges the code, fetches the user's profile, persists them in Firestore
 * (with the refresh token encrypted), mints a Firebase custom token and
 * redirects the browser back to the frontend with the token in the URL.
 */
router.get("/auth/google/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  if (error) {
    res.status(400).send(`Google OAuth error: ${error}`);
    return;
  }
  if (!code) {
    res.status(400).send("Missing authorization code");
    return;
  }
  if (!verifyState(state)) {
    res.status(400).send("Invalid OAuth state");
    return;
  }

  try {
    const oauth = getOAuthClient();
    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token) {
      res
        .status(400)
        .send(
          "Google did not return a refresh token. Revoke access at https://myaccount.google.com/permissions and retry."
        );
      return;
    }
    oauth.setCredentials(tokens);

    // Fetch the user's profile from Google.
    const oauth2 = google.oauth2({ version: "v2", auth: oauth });
    const { data: profile } = await oauth2.userinfo.get();
    const sub = profile.id;
    if (!sub || !profile.email) {
      res.status(500).send("Google profile is missing id/email");
      return;
    }

    const grantedScopes = (tokens.scope ?? "").split(" ").filter(Boolean);

    await upsertUser({
      uid: sub,
      email: profile.email,
      name: profile.name ?? "",
      picture: profile.picture ?? "",
      refreshToken: tokens.refresh_token,
      scopes: grantedScopes.length > 0 ? grantedScopes : GOOGLE_SCOPES,
    });

    const customToken = await adminAuth().createCustomToken(sub, {
      email: profile.email,
    });

    const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
    const redirect = `${frontendUrl}/auth/callback?token=${encodeURIComponent(customToken)}`;
    res.redirect(redirect);
  } catch (e) {
    console.error("OAuth callback failed:", e);
    res.status(500).send("OAuth callback failed");
  }
});

export default router;
