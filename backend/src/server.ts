import express from "express";
import dotenv from "dotenv";
import { processEmails } from "./scheduler/pollEmails.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (req, res) => {
    res.send("Finance Agent is running!");
});

app.get("/poll-emails", async (req, res) => {
  const response = await processEmails();
  console.log("Finished processing emails.");
  res.json({ success: true, data: response });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Start polling for emails
});