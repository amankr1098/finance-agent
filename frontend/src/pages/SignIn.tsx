import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GOOGLE_OAUTH_START_URL } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      className="size-4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.614Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default function SignInPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Surface backend OAuth errors that may have been redirected back with ?error=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get("error");
    if (err) setError(err);
  }, [location.search]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (user) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return <Navigate to={from ?? "/"} replace />;
  }

  const handleSignIn = () => {
    setSigningIn(true);
    setError(null);
    // Full-page redirect — backend will round-trip through Google and bounce
    // back to /auth/callback?token=<firebaseCustomToken>.
    window.location.assign(GOOGLE_OAUTH_START_URL);
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign in to Finance Agent</CardTitle>
          <CardDescription>
            Connect your Google account so the agent can read finance emails
            and write to your Google Sheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full"
          >
            <GoogleLogo />
            <span>{signingIn ? "Redirecting…" : "Continue with Google"}</span>
          </Button>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            By continuing you agree to grant Gmail and Sheets access to this app.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
