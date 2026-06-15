import { google } from "googleapis";
import { getAuthClient } from "../auth/google.js";


const sheet = google.sheets({ version: "v4", auth: getAuthClient() });

export async function createSheet() {
   const response = await sheet.spreadsheets.create({
        requestBody: {
            properties: {
                title: "Expense Tracker",
            },
            sheets: [
                {
                    properties: {
                        title: "Expenses",
                    },
                    data: [{
                        rowData: [{
                            values: ["Date","Vendor","Amount","Currency",
                     "Category","Recurring","Notes"].map(value => ({ userEnteredValue: { stringValue: value } }))
                        }]
                    }]
                }
            ]
        }
    });
    console.log("Created sheet with ID:", response.data.spreadsheetId);
    return response.data.spreadsheetId;
}

createSheet().catch(console.error);
