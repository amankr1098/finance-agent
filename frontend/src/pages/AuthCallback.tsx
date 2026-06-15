import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/auth/AuthProvider";

/**
 * Handles the redirect back from the backend after Google OAuth completes.
 * The backend appends `?token=<firebaseCustomToken>` to the URL; we exchange
 * that for a Firebase session via `signInWithCustomToken`.
 */
export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const token = params.get("token");
  const oauthError = params.get("error");

  useEffect(() => {
    let cancelled = false;

    async function exchange() {
      if (oauthError) {
        setError(oauthError);
        return;
      }
      if (!token) {
        setError("Missing token in callback URL.");
        return;
      }
      try {
        await signInWithCustomToken(auth, token);
        if (!cancelled) navigate("/", { replace: true });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to complete sign-in.");
        }
      }
    }

    exchange();
    return () => {
      cancelled = true;
    };
  }, [token, oauthError, navigate]);

  if (user && !error) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-destructive">Sign-in failed</h1>
            <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/sign-in", { replace: true })}
              className="text-sm underline underline-offset-4"
            >
              Back to sign-in
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Completing sign-in…</p>
        )}
      </div>
    </div>
  );
}
