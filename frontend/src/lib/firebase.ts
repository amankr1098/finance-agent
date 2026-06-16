import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { config } from "./config";

const firebaseConfig = {
  apiKey: config.FIREBASE_API_KEY,
  authDomain: config.FIREBASE_AUTH_DOMAIN,
  projectId: config.FIREBASE_PROJECT_ID,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Surface a clear error early so missing env vars don't trigger cryptic
  // "auth/invalid-api-key" failures deep inside the SDK.
  // eslint-disable-next-line no-console
  console.error(
    "[firebase] Missing VITE_FIREBASE_* env vars. Copy .env.example to .env and fill in your web app config."
  );
}

const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
