"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Withdrawal {
  id: string;
  amount: number;
  destinationBank: string | null;
  destinationAccount: string | null;
  accountName: string | null;
  status: string;
  reference: string | null;
  monnifyRef?: string | null;
  narration: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface WalletWithdrawalsProps {
  onSelectWithdrawal?: (w: Withdrawal) => void;
}

const statusBadge: Record<string, "warning" | "success" | "destructive" | "default" | "secondary"> = {
  PENDING_OTP: "warning",
  PENDING: "warning",
  PROCESSED: "success",
  APPROVED: "success",
  REJECTED: "destructive",
  FAILED: "destructive",
};

const statusLabel: Record<string, string> = {
  PENDING_OTP: "Awaiting OTP",
  PENDING: "Pending Approval",
  PROCESSED: "Processed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FAILED: "Failed",
};

export function WalletWithdrawals({ onSelectWithdrawal }: WalletWithdrawalsProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0, pending: 0, processed: 0, rejected: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab);
    fetch(`/api/wallet/withdrawals?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setWithdrawals(res.data);
          setCounts(res.counts);
        }
      })
      .catch((e) => console.error("wallet-withdrawals: fetch failed", e))
      .finally(() => setLoading(false));
  }, [tab]);

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "processed", label: "Processed", count: counts.processed },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "failed", label: "Failed", count: counts.failed },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-1 border-b border-neutral-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-4 text-center text-sm text-neutral-400">Loading...</p>
        ) : withdrawals.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-400">No withdrawals found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                  <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Amount</th>
                  <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Bank</th>
                  <th className="hidden sm:table-cell pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Account</th>
                  <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Status</th>
                  <th className="hidden sm:table-cell pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => onSelectWithdrawal?.(w)}>
                    <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{formatDate(w.createdAt)}</td>
                    <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-neutral-900">{formatCurrency(w.amount)}</td>
                    <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{w.destinationBank || "—"}</td>
                    <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 font-mono text-neutral-600">{w.destinationAccount || "—"}</td>
                    <td className="px-3 py-2 md:px-4 md:py-3">
                      <Badge variant={statusBadge[w.status] || "secondary"}>
                        {statusLabel[w.status] || w.status}
                      </Badge>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{w.reference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
