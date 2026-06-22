import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let _db: Firestore | null = null;
let _auth: Auth | null = null;

function loadServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is missing. Set it to a base64-encoded JSON service-account key."
    );
  }

  // Accept either raw JSON or base64-encoded JSON.
  let jsonStr = raw.trim();
  if (!jsonStr.startsWith("{")) {
    try {
      jsonStr = Buffer.from(jsonStr, "base64").toString("utf-8");
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid base64 nor JSON.");
    }
  }

  try {
    return JSON.parse(jsonStr) as ServiceAccount;
  } catch (e) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON could not be parsed as JSON.");
  }
}

function ensureApp() {
  if (getApps().length > 0) return;
  const serviceAccount = loadServiceAccount();
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID as string ?? (serviceAccount as { project_id?: string }).project_id,
  });
}

export function db(): Firestore {
  if (!_db) {
    ensureApp();
    _db = getFirestore();
  }
  return _db;
}

export function adminAuth(): Auth {
  if (!_auth) {
    ensureApp();
    _auth = getAuth();
  }
  return _auth;
}
