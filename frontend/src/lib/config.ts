/**
 * Runtime config — populated by /config.js (injected by entrypoint.sh at
 * container start from env vars). Falls back to Vite build-time env vars for
 * local development without Docker.
 */
const runtimeConfig = window.__CONFIG__ ?? {};

export const config = {
  API_BASE_URL:
    runtimeConfig.API_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8080",

  FIREBASE_API_KEY:
    runtimeConfig.FIREBASE_API_KEY ?? import.meta.env.VITE_FIREBASE_API_KEY,

  FIREBASE_AUTH_DOMAIN:
    runtimeConfig.FIREBASE_AUTH_DOMAIN ??
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  FIREBASE_PROJECT_ID:
    runtimeConfig.FIREBASE_PROJECT_ID ??
    import.meta.env.VITE_FIREBASE_PROJECT_ID,

  FIREBASE_STORAGE_BUCKET:
    runtimeConfig.FIREBASE_STORAGE_BUCKET ??
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  FIREBASE_MESSAGING_SENDER_ID:
    runtimeConfig.FIREBASE_MESSAGING_SENDER_ID ??
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,

  FIREBASE_APP_ID:
    runtimeConfig.FIREBASE_APP_ID ?? import.meta.env.VITE_FIREBASE_APP_ID,
};
