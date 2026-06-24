import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminFinancials } from "@/lib/dashboard/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminFinancialsClient } from "./client";

export default async function AdminFinancialsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login");

  let financials;
  try {
    financials = await getAdminFinancials();
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Financials</h1>
          <p className="mt-1 text-sm text-neutral-500">Platform revenue, escrow balances, and payout overview.</p>
        </div>
        <p className="text-sm text-danger">Failed to load financial data.</p>
      </div>
    );
  }

  const totalRevenue = financials.recentTransactions
    .filter((txn) => txn.category === "FEE")
    .reduce((sum, txn) => sum + Number(txn.amount), 0);
  const pendingPayouts = financials.pendingWithdrawals.reduce(
    (sum, w) => sum + Number(w.amount),
    0,
  );

  const serializedTransactions = financials.recentTransactions.map((t) => ({
    id: t.id,
    category: t.category,
    description: t.description,
    amount: Number(t.amount),
    date: typeof t.date === "string" ? t.date : t.date.toISOString(),
    owner: t.owner,
  }));

  const serializedWithdrawals = financials.pendingWithdrawals.map((w) => ({
    id: w.id,
    amount: Number(w.amount),
    createdAt: typeof w.createdAt === "string" ? w.createdAt : w.createdAt.toISOString(),
    status: w.status,
    wallet: w.wallet,
  }));

  return (
    <AdminFinancialsClient
      totalRevenue={totalRevenue}
      pendingPayouts={pendingPayouts}
      transactions={serializedTransactions}
      pendingWithdrawals={serializedWithdrawals}
    >
      <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
            <p className="mt-1 text-xs text-neutral-400">All-time platform fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Escrow Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{formatCurrency(0)}</p>
            <p className="mt-1 text-xs text-neutral-400">Funds held in escrow</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{formatCurrency(pendingPayouts)}</p>
            <p className="mt-1 text-xs text-neutral-400">Awaiting disbursement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">ID</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Description</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {financials.recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  financials.recentTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-sm text-neutral-700">{txn.id}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-900">{txn.description}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{formatDate(txn.date)}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge
                          variant={txn.category === "FEE" ? "secondary" : txn.category === "INCOME" ? "success" : "destructive"}
                        >
                          {txn.category === "FEE" ? "Fee" : txn.category === "INCOME" ? "Income" : "Expense"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right font-mono text-sm font-semibold text-neutral-900">
                        {formatCurrency(Number(txn.amount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">User</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Email</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {financials.pendingWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                      No pending withdrawals
                    </td>
                  </tr>
                ) : (
                  financials.pendingWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm font-medium text-neutral-900">
                        {w.wallet.user.fullName}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{w.wallet.user.email}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{formatDate(w.createdAt)}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant="warning">{w.status === "PENDING" ? "Pending" : w.status}</Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right font-mono text-sm font-semibold text-neutral-900">
                        {formatCurrency(Number(w.amount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
    </AdminFinancialsClient>
  );
}
