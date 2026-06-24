import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getClientFinancials } from "@/lib/dashboard/client";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ClientFinancialsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className="py-8 text-center text-sm text-neutral-400">You must be signed in to view this page.</p>;
  }
  let data;
  try {
    data = await getClientFinancials(session.user.id);
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Financials</h1>
          <p className="mt-1 text-sm text-neutral-500">Spending and transaction overview.</p>
        </div>
        <p className="py-8 text-center text-sm text-neutral-400">Failed to load financial data.</p>
      </div>
    );
  }

  const { totalSpent, totalWalletDebits, walletBalance, completedCount, recentTransactions } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Financials</h1>
        <p className="mt-1 text-sm text-neutral-500">Spending, wallet usage, and transaction history.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{formatCurrency(totalSpent)}</p>
            <p className="mt-1 text-xs text-neutral-400">{completedCount} completed bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{formatCurrency(walletBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Wallet Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{formatCurrency(totalWalletDebits)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Wallet Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Description</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Type</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {recentTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-900">{t.description || "—"}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{formatDate(t.createdAt)}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={t.type === "CREDIT" ? "success" : "destructive"}>
                          {t.type}
                        </Badge>
                      </td>
                      <td className={`px-3 py-2 md:px-4 md:py-3 font-mono ${t.type === "CREDIT" ? "text-success" : "text-danger"}`}>
                        {t.type === "CREDIT" ? "+" : "-"}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
