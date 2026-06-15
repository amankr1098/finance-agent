import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { processEmails } from "./scheduler/pollEmails.js";
import oauthRoutes from "./auth/oauthRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Finance Agent is running!");
});

// OAuth flow (browser-driven, no auth required)
app.use(oauthRoutes);

// Protected API
app.use("/api", userRoutes);

// Legacy single-user endpoint — will be migrated to /api/poll-emails (per user)
app.get("/poll-emails", async (_req, res) => {
  const response = await processEmails();
  console.log("Finished processing emails.");
  res.json({ success: true, data: response });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});