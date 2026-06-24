"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { openPrintWindow, buildFinancialReportHtml } from "@/lib/print";

interface Tx {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  date: string;
  owner: { fullName: string };
}

interface Wd {
  id: string;
  amount: number;
  createdAt: string;
  status: string;
  wallet: { user: { fullName: string; email: string } };
}

interface AdminFinancialsClientProps {
  totalRevenue: number;
  pendingPayouts: number;
  transactions: Tx[];
  pendingWithdrawals: Wd[];
  children: React.ReactNode;
}

export function AdminFinancialsClient({ totalRevenue, pendingPayouts, transactions, pendingWithdrawals, children }: AdminFinancialsClientProps) {
  const [companyName, setCompanyName] = useState("TruckLease Pro");

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/settings/public", { signal: ac.signal })
      .then((r) => r.json())
      .then((res) => { if (res.success && res.data.companyName) setCompanyName(res.data.companyName); })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  function handleDownload() {
    const txRows = transactions.map((t) =>
      `<tr><td>${t.id.substring(0, 8).toUpperCase()}</td><td>${t.description || "—"}</td><td>${t.owner.fullName}</td><td>${formatDate(t.date)}</td><td style="text-align:right">${formatCurrency(t.amount)}</td></tr>`
    ).join("");

    const wdRows = pendingWithdrawals.map((w) =>
      `<tr><td>${w.wallet.user.fullName}</td><td>${w.wallet.user.email}</td><td>${formatDate(w.createdAt)}</td><td>${w.status}</td><td style="text-align:right">${formatCurrency(w.amount)}</td></tr>`
    ).join("");

    const html = buildFinancialReportHtml({
      companyName,
      totalRevenue: formatCurrency(totalRevenue),
      pendingPayouts: formatCurrency(pendingPayouts),
      transactionsHtml: txRows,
      pendingWithdrawalsHtml: wdRows,
    });
    openPrintWindow(html, `Financial Report — ${companyName}`);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Financials</h1>
          <p className="mt-1 text-sm text-neutral-500">Platform revenue, escrow balances, and payout overview.</p>
        </div>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" /> Report
        </Button>
      </div>
      {children}
    </>
  );
}
