import { classifyAgent, financeAgent } from "../agent/agent.js";
import { ExpenseInput, ExpenseOutput } from "../agent/state.js";
import { classifyEmail } from "../agent/tasks/classifyEmail.js";
import { fetchEmails, getMailBody, markEmailAsProcessed } from "../tools/gmail.js";
import { getAuthClientForUser } from "../auth/google.js";
import { getUser } from "../db/users.js";
import { saveFinanceEmail, saveExpense } from "../db/expenses.js";


export interface ProcessEmailsResult {
    listFinance: ExpenseOutput[];
    listSubject: string[];
}

export async function processEmails(uid?: string): Promise<ProcessEmailsResult | undefined> {
    console.log("Polling for emails...");

    let authClient: Awaited<ReturnType<typeof getAuthClientForUser>> | undefined;
    let sheetId: string | undefined;

    if (uid) {
        authClient = await getAuthClientForUser(uid);
        const user = await getUser(uid);
        sheetId = user?.sheetId ?? undefined;
    }

    const messages = await fetchEmails({ mode: "unprocessed", maxResults: 15 }, authClient);


    if (messages.length === 0) {
        console.log("No new emails found.");
        return { listFinance: [], listSubject: [] };
    }

    console.log(`Found ${messages.length} new email(s). Processing...`);

    var listFinance: ExpenseOutput[] = [];

    var listSubject: string[] = [];

    for (const message of messages) {
        console.log("New email found with ID:", message.id);
        // Here you would typically trigger your agent workflow, passing the email ID and other necessary details
        const { subject, from, body } = await getMailBody(message.id!, authClient);

        listSubject.push(subject);

        const classification = await classifyAgent.invoke(
            { subject, body },
            {
                configurable: {
                    thread_id: message.id!
                }
            }
        );
        console.log("Classification Result:", classification);
        if (!classification.isFinance) {
            console.log(`Email with ID ${message.id} and subject "${subject}" classified as not finance-related. Skipping...`);
            continue;
        }

        // Persist finance-classified email record
        if (uid) {
            await saveFinanceEmail(uid, {
                emailId: message.id!,
                subject,
                from,
                category: classification.category,
            });
        }



        try {

            const input: ExpenseInput = {
                emailBody: body,
                emailId: message.id!,
                subject,
                from,
                accessToken: process.env.GOOGLE_REFRESH_TOKEN ?? "",
                sheetId: sheetId ?? process.env.GOOGLE_SHEET_ID ?? "",
                category: classification.category
            }
            const result = await financeAgent.invoke(input, {
                configurable: {
                    thread_id: (message.id + "_expense_extractor")!
                }
            });
            const expenseOutput = { emailId: message.id!, subject, from, category: classification.category, extractedResults: result };
            listFinance.push(expenseOutput);

            // Persist extracted expense to its own collection
            if (uid) {
                await saveExpense(uid, expenseOutput);
            }
        } catch (error) {
            console.error(`Error processing email with ID ${message.id}:`, error);
        }

        // Label email as processed so it is excluded from future polls
        try {
            await markEmailAsProcessed(message.id!, authClient);
        } catch (error) {
            console.error(`Failed to label email ${message.id} as processed:`, error);
        }

    }

    return {
        listFinance,
        listSubject
    };
}