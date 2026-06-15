import "dotenv/config";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function main() {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "").trim();
  if (!raw) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON is empty");
    process.exit(1);
  }

  let jsonStr = raw;
  if (!jsonStr.startsWith("{")) {
    try {
      jsonStr = Buffer.from(jsonStr, "base64").toString("utf-8");
    } catch {
      console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON is not valid base64");
      process.exit(1);
    }
  }

  let sa: ServiceAccount & { project_id: string; client_email: string };
  try {
    sa = JSON.parse(jsonStr);
  } catch (e) {
    console.error("❌ Decoded payload is not valid JSON:", e);
    process.exit(1);
  }

  console.log("✅ Service account decoded");
  console.log("   project_id   :", sa.project_id);
  console.log("   client_email :", sa.client_email);
  console.log("   FIREBASE_PROJECT_ID env :", process.env.FIREBASE_PROJECT_ID);
  console.log("   match        :", sa.project_id === process.env.FIREBASE_PROJECT_ID);

  const appSecret = process.env.APP_SECRET ?? "";
  console.log("✅ APP_SECRET length :", appSecret.length, appSecret.length >= 32 ? "(OK)" : "(too short)");

  console.log("✅ PORT         :", process.env.PORT);
  console.log("✅ BACKEND_URL  :", process.env.BACKEND_URL);
  console.log("✅ FRONTEND_URL :", process.env.FRONTEND_URL);
  console.log("✅ GOOGLE_CLIENT_ID set     :", Boolean(process.env.GOOGLE_CLIENT_ID));
  console.log("✅ GOOGLE_CLIENT_SECRET set :", Boolean(process.env.GOOGLE_CLIENT_SECRET));

  const portStr = process.env.PORT ?? "";
  const backendUrl = process.env.BACKEND_URL ?? "";
  if (portStr && backendUrl && !backendUrl.includes(`:${portStr}`)) {
    console.warn(`⚠️  PORT=${portStr} but BACKEND_URL=${backendUrl} — port mismatch may break OAuth redirect URI`);
  }

  const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
  const db = getFirestore(app);

  try {
    await db.collection("_diag").doc("ping").set({ at: new Date().toISOString() });
    console.log("✅ Firestore write OK (wrote _diag/ping)");
  } catch (e) {
    console.error("❌ Firestore write failed:", e);
    process.exit(1);
  }
  process.exit(0);
}

void main();
