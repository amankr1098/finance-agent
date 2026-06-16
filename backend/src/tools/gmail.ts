import { gmail_v1, google } from "googleapis";
import { getAuthClient } from "../auth/google.js";

type OAuth2Client = ReturnType<typeof getAuthClient>;

export type FetchOptionMode = "unprocessed" | "backfill" | "reprocess";

export interface FetchOptions {
    mode: FetchOptionMode;
    maxResults?: number; // Only for "unprocessed" mode
    after?: string; // ISO format date string, required for backfill mode
    before?: string;   // ISO format date string, required for backfill mode
}

function getMailClient(authClient?: OAuth2Client) {
    return google.gmail({ version: "v1", auth: authClient ?? getAuthClient() });
}

export async function fetchEmails(options: FetchOptions, authClient?: OAuth2Client) {
    const mode = options.mode;
    let query = "";
    switch (mode) {
        case "unprocessed":
            query = "-label:finance-processed";
            break;
        case "backfill":
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const dateStr = sixMonthsAgo.toISOString().split("T")[0]?.replace(/-/g, "/");
            query = `-label:finance-processed after:${dateStr}`;
            break;
        case "reprocess":
            query = [
                "label:finance-processed",
                options.after ? `after:${options.after}` : "",
                options.before ? `before:${options.before}` : ""
            ].filter(Boolean).join(" ");
            break;
    }
    const gmail = getMailClient(authClient);
    const response = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: options.maxResults ?? 5,
    });
    return response.data.messages ?? [];
}
// gmail.users.messages.list({
//     userId: "me",
//     q: "is:unread",
// })


export async function getMailBody(messageId: string, authClient?: OAuth2Client): Promise<{ subject: string; from: string; body: string }> {
    const gmail = getMailClient(authClient);
    const response = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
    });
    console.log("Fetched email with ID:", messageId);
    console.log("Email snippet:", response.data.snippet);
    const message = response.data;
    const headers = message.payload?.headers || [];
    const subject = headers.find(h => h.name === "Subject")?.value || "No Subject";
    const from = headers.find(h => h.name === "From")?.value || "Unknown Sender";

    const body = extractBody(message.payload as gmail_v1.Schema$MessagePart);

    // console.log("Extracted email body:", body.slice(0, 200)); // Log the first 200 characters of the body

    return { subject, from, body };
}

function extractBody(payload: gmail_v1.Schema$MessagePart): string {
    if (!payload) return "";

    // Plain text part
    if (payload.mimeType === "text/plain" && payload.body?.data) {
        return Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    // HTML part fallback
    if (payload.mimeType === "text/html" && payload.body?.data) {
        return Buffer.from(payload.body.data, "base64")
            .toString("utf-8")
            .replace(/<[^>]+>/g, " ");   // strip HTML tags
    }

    // Multipart — recurse into parts
    if (payload.parts) {
        for (const part of payload.parts) {
            const text = extractBody(part);
            if (text) return text;
        }
    }

    return "";
}


async function getOrCreateLabel(labelName: string, authClient?: OAuth2Client): Promise<string> {
    const gmail = getMailClient(authClient);
    const res = await gmail.users.labels.list({ userId: "me" });
    const labels = res.data.labels || [];
    const existingLabel = labels.find(label => label.name === labelName);
    if (existingLabel) {
        return existingLabel.id!;
    }
    const createRes = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
            name: labelName,
            labelListVisibility: "labelShow",
            messageListVisibility: "show"
        }
    });
    return createRes.data.id!;

}


export async function markEmailAsProcessed(messageId: string, authClient?: OAuth2Client) {
    const labelId = await getOrCreateLabel("finance-processed", authClient);
    const gmail = getMailClient(authClient);
    await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
            addLabelIds: [labelId],
        },
    });
}
