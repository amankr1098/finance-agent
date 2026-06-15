import { task } from "@langchain/langgraph";
import { ExpenseInput } from "../state.js";
import { getModel } from "../model.js";

const EXTRACTION_PROMPT = (input: ExpenseInput) => `
You are a financial data extractor.
This email has already been classified as: ${input.category}
From: ${input.from}
Subject: ${input.subject}

Extract vendor, amount, currency, date, isRecurring, notes.
Return ONLY valid JSON.

Email:
${input.emailBody}
`;

export const extractExpense = task({name : "extract_expense"}, async (input: ExpenseInput) => {
        const { emailBody, emailId, accessToken, sheetId } = input;

        console.log("Extracting expense details from email with ID:", emailId);

        const result = await getModel('openrouter').invoke(EXTRACTION_PROMPT(input));

        const raw = (result.content as string).replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        console.log("Raw extraction result:", raw);
        try {
            const parsed = JSON.parse(raw);
            console.log("Parsed extraction result:", parsed);
            return parsed;
        } catch (error) {
            console.error("Failed to parse extraction result:", error);
            throw new Error("Failed to extract expense details. Invalid JSON format.");
        }

});