import { Router, type Response } from "express";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";
import { getUserPublic, getPollStatus, setPollStatus } from "../db/users.js";
import { processEmails } from "../scheduler/pollEmails.js";
import { getFinanceEmails, getExpenses } from "../db/expenses.js";
import { Timestamp } from "firebase-admin/firestore";

const router: Router = Router();

router.get("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const user = await getUserPublic(uid);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

/**
 * GET /api/poll-status
 * Returns the polling status for the authenticated user (for UI display).
 */
router.get("/poll-status", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const status = await getPollStatus(uid);
  res.json({ pollStatus: status ?? null });
});

/**
 * POST /api/poll-emails
 * Triggers email polling for the authenticated user.
 * If the user has never polled before (no DB record), starts immediately and
 * records the baseline. Otherwise triggers a normal incremental poll.
 */
router.post("/poll-emails", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;

  const existing = await getPollStatus(uid);

  // Mark as polling
  await setPollStatus(uid, {
    isPolling: true,
    lastPolledAt: existing?.lastPolledAt ?? null,
    totalEmailsProcessed: existing?.totalEmailsProcessed ?? 0,
    financeEmailsFound: existing?.financeEmailsFound ?? 0,
    error: null,
  });

  try {
    const result = await processEmails(uid);

    const newEmailsCount = result?.listSubject.length ?? 0;
    const newFinanceCount = result?.listFinance.length ?? 0;

    // Derive totals from DB so counts are always accurate regardless of how
    // many times the user syncs (idempotent — no double-counting).
    const [allExpenses, allFinanceEmails] = await Promise.all([
      getExpenses(uid),
      getFinanceEmails(uid),
    ]);

    await setPollStatus(uid, {
      isPolling: false,
      lastPolledAt: Timestamp.now(),
      totalEmailsProcessed: allExpenses.length + allFinanceEmails.length,
      financeEmailsFound: allFinanceEmails.length,
      error: null,
    });

    res.json({
      success: true,
      firstPoll: !existing,
      totalEmailsProcessed: newEmailsCount,
      financeEmailsFound: newFinanceCount,
    });
  } catch (err: any) {
    await setPollStatus(uid, {
      isPolling: false,
      lastPolledAt: existing?.lastPolledAt ?? null,
      totalEmailsProcessed: existing?.totalEmailsProcessed ?? 0,
      financeEmailsFound: existing?.financeEmailsFound ?? 0,
      error: err?.message ?? "Unknown error",
    });
    res.status(500).json({ error: "Failed to process emails", details: err?.message });
  }
});

/**
 * GET /api/finance-emails
 * Returns all finance-classified emails for the authenticated user.
 */
router.get("/finance-emails", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const records = await getFinanceEmails(uid);
  res.json({ financeEmails: records });
});

/**
 * GET /api/expenses
 * Returns all extracted expense records for the authenticated user.
 */
router.get("/expenses", requireAuth, async (req: AuthedRequest, res: Response) => {
  const uid = req.user!.uid;
  const records = await getExpenses(uid);
  res.json({ expenses: records });
});

export default router;
