import { useAuth } from "@/auth/AuthProvider";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="text-sm text-muted-foreground">
        {user?.email ? `Signed in as ${user.email}.` : "Your profile."}
      </p>
    </div>
  );
}
