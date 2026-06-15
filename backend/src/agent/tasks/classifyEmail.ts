import { task } from "@langchain/langgraph";
import { getModel } from "../model.js";


export type EmailCategory =
    | "invoice"
    | "receipt"
    | "bill"
    | "subscription"
    | "bank_transaction"
    | "order_confirmation"
    | "not_finance";


export interface ClassifyResult {
    category: EmailCategory;
    isFinance: boolean;
    confidence: "high" | "medium" | "low";
    reason: string;
}

const CLASSIFY_PROMPT = (subject: string, body: string) => `
You are a financial email classifier.

Given the email below, decide if it is finance-related.
Finance-related means: invoice, receipt, bill, bank transaction,
subscription charge, order confirmation, payment confirmation,upi transaction,
or any email that involves money being spent or charged.
Try to be as accurate as possible, and only classify as finance-related if you are confident based on the content of the email.
Try to avoid otps for payments, as they are not finance-related, statements banks, or any third party app mails that are not related to transactions. Try to avoid emails that are just marketing emails about finance products, as they are not finance-related.
Find mostly credited and debited transactions, and avoid classifying emails that are just statements or notifications from banks or financial institutions that do not involve a transaction. If the email is finance-related, classify it into one of the following categories: invoice, receipt, bill, subscription, bank_transaction, order_confirmation. If it is not finance-related, classify it as not_finance.

Return ONLY valid JSON in this exact shape:
{
  "category": "invoice|receipt|bill|subscription|bank_transaction|order_confirmation|not_finance",
  "isFinance": true or false,
  "confidence": "high|medium|low",
  "reason": "one sentence explanation"
}

Subject: ${subject}
Body: ${body.slice(0, 1000)}
`;


export const classifyEmail = task(
    "classify_email"
    , async (input: { subject: string; body: string }): Promise<ClassifyResult> => {
        const { subject, body } = input;
        console.log("Classifying email with subject:", subject);
        console.log("Email body snippet for classification:", body.length); // Log the first 200 characters of the body for debugging
        const response = await getModel("openrouter").invoke(CLASSIFY_PROMPT(subject, body))
        const raw = (response.content as string).replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed: ClassifyResult = JSON.parse(raw);
        console.log("Classification Result:", parsed.category);
        return parsed;
    })

