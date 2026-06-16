import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import { decryptString, encryptString } from "../auth/crypto.js";

export interface GoogleConnection {
  refreshTokenEnc: string; // AES-256-GCM encrypted refresh token (base64)
  scopes: string[];
  connectedAt: Timestamp;
}

export interface UserDoc {
  uid: string;
  email: string;
  name: string;
  picture: string;
  google: GoogleConnection;
  sheetId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UpsertUserInput {
  uid: string;
  email: string;
  name: string;
  picture: string;
  refreshToken: string;
  scopes: string[];
}

const USERS = "users";

export async function upsertUser(input: UpsertUserInput): Promise<void> {
  const ref = db().collection(USERS).doc(input.uid);
  const snap = await ref.get();
  const now = FieldValue.serverTimestamp();

  const googleConnection = {
    refreshTokenEnc: encryptString(input.refreshToken),
    scopes: input.scopes,
    connectedAt: now,
  };

  if (!snap.exists) {
    await ref.set({
      uid: input.uid,
      email: input.email,
      name: input.name,
      picture: input.picture,
      google: googleConnection,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  await ref.set(
    {
      email: input.email,
      name: input.name,
      picture: input.picture,
      google: googleConnection,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await db().collection(USERS).doc(uid).get();
  return snap.exists ? (snap.data() as UserDoc) : null;
}

export async function getUserPublic(uid: string) {
  const user = await getUser(uid);
  if (!user) return null;
  // Strip secrets before returning to clients.
  return {
    uid: user.uid,
    email: user.email,
    name: user.name,
    picture: user.picture,
    sheetId: user.sheetId ?? null,
    scopes: user.google?.scopes ?? [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getRefreshToken(uid: string): Promise<string | null> {
  const user = await getUser(uid);
  if (!user?.google?.refreshTokenEnc) return null;
  return decryptString(user.google.refreshTokenEnc);
}

export async function setSheetId(uid: string, sheetId: string): Promise<void> {
  await db().collection(USERS).doc(uid).set(
    {
      sheetId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export interface PollStatus {
  lastPolledAt: Timestamp | null;
  isPolling: boolean;
  totalEmailsProcessed: number;
  financeEmailsFound: number;
  error?: string | null;
}

export async function getPollStatus(uid: string): Promise<PollStatus | null> {
  const snap = await db().collection(USERS).doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data?.pollStatus) return null;
  return data.pollStatus as PollStatus;
}

export async function setPollStatus(
  uid: string,
  status: Partial<PollStatus>
): Promise<void> {
  await db()
    .collection(USERS)
    .doc(uid)
    .set({ pollStatus: status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}
