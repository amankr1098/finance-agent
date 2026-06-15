import { google } from "googleapis";
import "dotenv/config";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

export function getAuthClient(): OAuth2Client {
  console.log("Initializing Google OAuth2 Client with refresh token...");
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  console.log("Setting credentials with refresh token...");
  client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? null,
    // access token auto-refreshes — you never touch it again
  });

  return client;
}