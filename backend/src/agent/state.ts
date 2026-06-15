
export interface ExpenseInput {
    emailBody: string;
    emailId: string;
    subject: string;
    from: string;
    accessToken: string;
    sheetId: string;
    category: string;
}

export interface ExpenseState extends ExpenseInput {
    amount: number;
    date: string;
    vendor: string;
}

export interface ExpenseOutput {
    emailId: string;
    subject: string;
    from: string;
    category: string;
    extractedResults?: any
}

