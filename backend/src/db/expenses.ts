import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import { ExpenseOutput } from "../agent/state.js";

/**
 * Firestore collections:
 *  users/{uid}/financeEmails/{emailId}   — every email classified as finance
 *  users/{uid}/expenses/{emailId}        — extracted expense detail per email
 */

export interface FinanceEmailRecord {
  emailId: string;
  subject: string;
  from: string;
  category: string;
  processedAt: FirebaseFirestore.FieldValue;
}

export interface ExpenseRecord {
  emailId: string;
  subject: string;
  from: string;
  category: string;
  extractedResults: any;
  savedAt: FirebaseFirestore.FieldValue;
}

/**
 * Saves one finance-classified email record under users/{uid}/financeEmails/{emailId}.
 */
export async function saveFinanceEmail(
  uid: string,
  record: Omit<FinanceEmailRecord, "processedAt">
): Promise<void> {
  await db()
    .collection("users")
    .doc(uid)
    .collection("financeEmails")
    .doc(record.emailId)
    .set({ ...record, processedAt: FieldValue.serverTimestamp() });
}

/**
 * Saves the full extracted expense output under users/{uid}/expenses/{emailId}.
 */
export async function saveExpense(
  uid: string,
  output: ExpenseOutput
): Promise<void> {
  const record: Omit<ExpenseRecord, "savedAt"> = {
    emailId: output.emailId,
    subject: output.subject,
    from: output.from,
    category: output.category,
    extractedResults: output.extractedResults ?? null,
  };

  await db()
    .collection("users")
    .doc(uid)
    .collection("expenses")
    .doc(output.emailId)
    .set({ ...record, savedAt: FieldValue.serverTimestamp() });
}

/**
 * Returns all finance emails for a user, newest first.
 */
export async function getFinanceEmails(uid: string): Promise<FinanceEmailRecord[]> {
  const snap = await db()
    .collection("users")
    .doc(uid)
    .collection("financeEmails")
    .orderBy("processedAt", "desc")
    .get();
  return snap.docs.map((d) => d.data() as FinanceEmailRecord);
}

/**
 * Returns all saved expenses for a user, newest first.
 */
export async function getExpenses(uid: string): Promise<ExpenseRecord[]> {
  const snap = await db()
    .collection("users")
    .doc(uid)
    .collection("expenses")
    .orderBy("savedAt", "desc")
    .get();
  return snap.docs.map((d) => d.data() as ExpenseRecord);
}
