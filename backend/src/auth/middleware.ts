import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../db/firebase.js";

export interface AuthedRequest extends Request {
  user?: {
    uid: string;
    email: string | undefined;
  };
}

/**
 * Express middleware that verifies a Firebase ID token from the
 * `Authorization: Bearer <idToken>` header and attaches `req.user`.
 */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }
  const idToken = match[1]!;

  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid or expired ID token" });
  }
}
