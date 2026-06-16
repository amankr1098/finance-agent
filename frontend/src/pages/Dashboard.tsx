import { Loader2, RefreshCw, TrendingUp, Mail, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import type { Expense } from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(seconds: number | undefined): string {
  if (!seconds) return "—";
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function FullPageLoader({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
      <Loader2 className="size-10 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <CardDescription>{label}</CardDescription>
        </div>
        <CardTitle className="text-3xl font-bold">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const ex = expense.extractedResults;
  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
      <td className="py-3 px-4 text-sm">{ex?.date ?? "—"}</td>
      <td className="py-3 px-4 text-sm font-medium">{ex?.vendor ?? expense.from}</td>
      <td className="py-3 px-4 text-sm">
        {ex ? formatCurrency(ex.amount, ex.currency) : "—"}
      </td>
      <td className="py-3 px-4 text-sm">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
          {expense.category}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
        {ex?.notes || expense.subject}
      </td>
      <td className="py-3 px-4 text-xs text-center">
        {ex?.isRecurring ? (
          <span className="inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400">Recurring</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <DollarSign className="size-10 text-muted-foreground/40" />
      <p className="font-medium text-muted-foreground">No expenses found</p>
      <p className="text-sm text-muted-foreground/60">Processed emails will appear here.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { state, refresh } = useDashboard();

  const isLoading =
    state.status === "checking" ||
    state.status === "polling" ||
    state.status === "loading";

  const loaderMessage =
    state.status === "checking"
      ? "Checking your account…"
      : state.status === "polling"
      ? "Scanning your emails for finance activity… this may take a moment."
      : "Loading your expenses…";

  return (
    <>
      {/* Full-page overlay loader */}
      {isLoading && <FullPageLoader message={loaderMessage} />}

      <div className="flex flex-col gap-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            {state.status === "ready" && state.pollStatus.lastPolledAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Last synced {formatDate(state.pollStatus.lastPolledAt._seconds)}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={refresh}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Sync emails
          </Button>
        </div>

        {/* Error state */}
        {state.status === "error" && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="size-5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Something went wrong</p>
                <p className="text-xs text-muted-foreground">{state.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {state.status === "ready" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={<Mail className="size-4" />}
                label="Emails processed"
                value={state.pollStatus.totalEmailsProcessed}
              />
              <StatCard
                icon={<TrendingUp className="size-4" />}
                label="Finance emails found"
                value={state.pollStatus.financeEmailsFound}
              />
              <StatCard
                icon={<DollarSign className="size-4" />}
                label="Expenses recorded"
                value={state.expenses.length}
              />
            </div>

            {/* Expense table */}
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>Finance transactions extracted from your inbox</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {state.expenses.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
                          <th className="py-2.5 px-4 font-medium">Date</th>
                          <th className="py-2.5 px-4 font-medium">Vendor</th>
                          <th className="py-2.5 px-4 font-medium">Amount</th>
                          <th className="py-2.5 px-4 font-medium">Category</th>
                          <th className="py-2.5 px-4 font-medium">Notes</th>
                          <th className="py-2.5 px-4 font-medium text-center">Recurring</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.expenses.map((e) => (
                          <ExpenseRow key={e.emailId} expense={e} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

