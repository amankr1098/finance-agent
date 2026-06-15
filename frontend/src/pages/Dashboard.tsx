import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/auth/AuthProvider";
import { apiFetch, ApiError } from "@/lib/api";

interface MeResponse {
  uid: string;
  email: string;
  name: string;
  picture: string;
  sheetId: string | null;
  scopes: string[];
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<MeResponse>("/api/me")
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load profile.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome{me?.name ? `, ${me.name}` : ""}</CardTitle>
          <CardDescription>
            You are signed in as {user?.email ?? me?.email ?? "—"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {error ? (
            <p className="text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {me ? (
            <ul className="flex flex-col gap-1 text-muted-foreground">
              <li>
                <span className="text-foreground">UID:</span> {me.uid}
              </li>
              <li>
                <span className="text-foreground">Scopes:</span>{" "}
                {me.scopes.length} granted
              </li>
              <li>
                <span className="text-foreground">Sheet:</span>{" "}
                {me.sheetId ?? "not configured"}
              </li>
            </ul>
          ) : !error ? (
            <p className="text-muted-foreground">Loading profile…</p>
          ) : null}
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
