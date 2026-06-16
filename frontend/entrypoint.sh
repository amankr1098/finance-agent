#!/bin/sh
# Generates /config.js at container start from environment variables.
# Supports two naming conventions:
#   - Plain vars (API_BASE_URL)      → preferred for Kubernetes / docker run -e
#   - VITE_* vars (VITE_API_BASE_URL) → fallback, so --env-file with a local .env works too
cat <<EOF > /usr/share/nginx/html/config.js
window.__CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL:-${VITE_API_BASE_URL:-http://localhost:8000}}",
  FIREBASE_API_KEY: "${FIREBASE_API_KEY:-${VITE_FIREBASE_API_KEY:-}}",
  FIREBASE_AUTH_DOMAIN: "${FIREBASE_AUTH_DOMAIN:-${VITE_FIREBASE_AUTH_DOMAIN:-}}",
  FIREBASE_PROJECT_ID: "${FIREBASE_PROJECT_ID:-${VITE_FIREBASE_PROJECT_ID:-}}",
  FIREBASE_STORAGE_BUCKET: "${FIREBASE_STORAGE_BUCKET:-${VITE_FIREBASE_STORAGE_BUCKET:-}}",
  FIREBASE_MESSAGING_SENDER_ID: "${FIREBASE_MESSAGING_SENDER_ID:-${VITE_FIREBASE_MESSAGING_SENDER_ID:-}}",
  FIREBASE_APP_ID: "${FIREBASE_APP_ID:-${VITE_FIREBASE_APP_ID:-}}"
};
EOF

exec nginx -g "daemon off;"
