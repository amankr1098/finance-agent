// Vercel serverless entry point — re-exports the Express app.
// Vercel calls this handler for every request routed to the backend.
import app from "../src/app.js";

export default app;
