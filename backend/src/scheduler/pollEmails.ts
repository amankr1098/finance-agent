import { classifyAgent, financeAgent } from "../agent/agent.js";
import { ExpenseInput, ExpenseOutput } from "../agent/state.js";
import { classifyEmail } from "../agent/tasks/classifyEmail.js";
import { fetchEmails, getMailBody } from "../tools/gmail.js";



export async function processEmails() {
    console.log("Polling for emails...");
    const messages = await fetchEmails({ mode: "unprocessed", maxResults: 15 });


    if (messages.length === 0) {
        console.log("No new emails found.");
        return;
    }

    console.log(`Found ${messages.length} new email(s). Processing...`);

    var listFinance: ExpenseOutput[] = [];

    var listSubject: string[] = [];

    for (const message of messages) {
        console.log("New email found with ID:", message.id);
        // Here you would typically trigger your agent workflow, passing the email ID and other necessary details
        const { subject, from, body } = await getMailBody(message.id!);

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



        try {

            const input: ExpenseInput = {
                emailBody: body,
                emailId: message.id!,
                subject,
                from,
                accessToken: process.env.GOOGLE_REFRESH_TOKEN ? process.env.GOOGLE_REFRESH_TOKEN : "",
                sheetId: process.env.GOOGLE_SHEET_ID ? process.env.GOOGLE_SHEET_ID : "",
                category: classification.category
            }
            const result = await financeAgent.invoke(input, {
                configurable: {
                    thread_id: (message.id + "_expense_extractor")!
                }
            });
            if (classification.isFinance) {
                listFinance.push({ emailId: message.id!, subject, from, category: classification.category, extractedResults: result });
            }
        } catch (error) {
            console.error(`Error processing email with ID ${message.id}:`, error);
        }






        setTimeout(() => {
            console.log("Executed after 2 seconds");
        }, 2000);

    }

    return {
        listFinance,
        listSubject
    };
}