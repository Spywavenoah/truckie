"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface Withdrawal {
  id: string;
  amount: number;
  destinationBank: string | null;
  destinationAccount: string | null;
  accountName: string | null;
  status: string;
  createdAt: string;
  wallet: {
    user: { fullName: string; email: string };
  };
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/withdrawals?status=PENDING");
      const json = await res.json();
      if (json.success) setWithdrawals(json.data);
    } catch {
      toast("Failed to load withdrawals", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/${action}`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast(json.message, { variant: "success" });
        fetchWithdrawals();
      } else {
        toast(json.error || "Action failed", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-neutral-400">Loading withdrawals...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Withdrawals</h1>
          <p className="mt-1 text-sm text-neutral-500">Approve or reject pending withdrawal requests.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWithdrawals}>
          <RefreshCw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals ({withdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">User</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Bank Details</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Amount</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                      No pending withdrawals
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <p className="text-sm font-medium text-neutral-900">{w.wallet.user.fullName}</p>
                        <p className="text-xs text-neutral-500">{w.wallet.user.email}</p>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <p className="text-sm text-neutral-900">{w.accountName}</p>
                        <p className="text-xs text-neutral-500">{w.destinationBank} — {w.destinationAccount}</p>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{formatDate(w.createdAt)}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right font-mono text-sm font-semibold text-neutral-900">
                        {formatCurrency(Number(w.amount))}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-success text-success hover:bg-success/10"
                            disabled={busyId === w.id}
                            onClick={() => handleAction(w.id, "approve")}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            {busyId === w.id ? "..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-danger text-danger hover:bg-danger/10"
                            disabled={busyId === w.id}
                            onClick={() => handleAction(w.id, "reject")}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            {busyId === w.id ? "..." : "Reject"}
                          </Button>
                        </div>
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
  );
}
