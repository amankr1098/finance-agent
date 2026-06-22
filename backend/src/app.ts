import express, { type Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import oauthRoutes from "./auth/oauthRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Load .env for local development; no-op in Vercel (vars injected at runtime)
dotenv.config();

const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const app: Application = express();

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

// Protected API routes
app.use("/api", userRoutes);

export default app;
