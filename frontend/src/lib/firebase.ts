import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
