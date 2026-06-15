import { ExpenseInput } from "./state.js";
import { entrypoint, MemorySaver } from "@langchain/langgraph";
import { classifyEmail, ClassifyResult } from "./tasks/classifyEmail.js";
import { extractExpense } from "./tasks/extractExpense.js";
import { config } from "dotenv";



const financeCheckpointer = new MemorySaver();

export const financeAgent = entrypoint(
    { checkpointer: financeCheckpointer, name: "expense_entry" },
    async (input: ExpenseInput) => {
       
        const classification = await classifyEmail({ subject: input.subject, body: input.emailBody });
        console.log("Classification Result:", classification);

        const expenseDetails = await extractExpense(input);

        return expenseDetails;

        // Use the emailBody to extract expense details using the model
        // const response = await model.invoke(`Extract the expense details from the following email: ${emailBody}`);
        // console.log("Model Response:", response);

    }
)


const classificationCheckpointer = new MemorySaver();

export const classifyAgent = entrypoint(
    { checkpointer: classificationCheckpointer, name: "classification_entry" },
    async (input: { subject: string; body: string; }): Promise<ClassifyResult> => {
        const classification = await classifyEmail(input);
        console.log("Classification Result:", classification);
        return classification;
    },
)





