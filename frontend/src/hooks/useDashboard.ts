import { useCallback, useEffect, useState } from "react";
import {
  getExpenses,
  getFinanceEmails,
  getPollStatus,
  triggerPollEmails,
  type Expense,
  type FinanceEmail,
  type PollStatus,
} from "@/lib/api";

export type DashboardState =
  | { status: "idle" }
  | { status: "checking" }          // fetching poll status from DB
  | { status: "polling" }           // running poll-emails
  | { status: "loading" }           // fetching expense data
  | { status: "ready"; expenses: Expense[]; financeEmails: FinanceEmail[]; pollStatus: PollStatus }
  | { status: "error"; message: string };

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({ status: "idle" });

  const loadData = useCallback(async (poll: PollStatus) => {
    setState({ status: "loading" });
    try {
      const [expRes, feRes] = await Promise.all([getExpenses(), getFinanceEmails()]);
      setState({
        status: "ready",
        expenses: expRes.expenses,
        financeEmails: feRes.financeEmails,
        pollStatus: poll,
      });
    } catch (e: any) {
      setState({ status: "error", message: e?.message ?? "Failed to load expense data." });
    }
  }, []);

  const refresh = useCallback(async () => {
    setState({ status: "polling" });
    try {
      await triggerPollEmails();
      // Re-fetch updated poll status then data
      const { pollStatus } = await getPollStatus();
      await loadData(pollStatus!);
    } catch (e: any) {
      setState({ status: "error", message: e?.message ?? "Polling failed." });
    }
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setState({ status: "checking" });
      try {
        const { pollStatus } = await getPollStatus();

        if (cancelled) return;

        if (!pollStatus) {
          // First-time user — run initial poll automatically
          setState({ status: "polling" });
          await triggerPollEmails();
          if (cancelled) return;
          const { pollStatus: updated } = await getPollStatus();
          if (!cancelled) await loadData(updated!);
        } else {
          await loadData(pollStatus);
        }
      } catch (e: any) {
        if (!cancelled)
          setState({ status: "error", message: e?.message ?? "Initialisation failed." });
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  return { state, refresh };
}
