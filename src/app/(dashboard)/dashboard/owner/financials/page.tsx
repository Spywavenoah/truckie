"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download } from "lucide-react";
import { openPrintWindow, buildReceiptHtml } from "@/lib/print";

interface Transaction {
  id: string;
  category: string;
  subCategory: string | null;
  description: string | null;
  amount: number;
  date: string;
  asset: { title: string } | null;
  booking: { id: string } | null;
}

export default function FinancialsPage() {
  const [data, setData] = useState<{ totalIncome: number; totalExpenses: number; netProfit: number; recentTransactions: Transaction[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("TruckLease Pro");

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/financials/owner", { signal: ac.signal })
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/settings/public", { signal: ac.signal })
      .then((r) => r.json())
      .then((res) => { if (res.success && res.data.companyName) setCompanyName(res.data.companyName); })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  function handlePrintReport() {
    if (!data) return;
    const rows = data.recentTransactions.map((t) =>
      `<tr><td>${t.id.substring(0, 8).toUpperCase()}</td><td>${t.description || t.asset?.title || "—"}</td><td>${formatDate(t.date)}</td><td style="text-align:right">${t.category === "INCOME" ? "+" : "-"}${formatCurrency(t.amount)}</td></tr>`
    ).join("");
    const bodyHtml = `
      <p><strong>Total Income:</strong> ${formatCurrency(data.totalIncome)}</p>
      <p><strong>Total Expenses:</strong> ${formatCurrency(data.totalExpenses)}</p>
      <p><strong>Net Profit:</strong> ${formatCurrency(data.netProfit)}</p>
      <h3 style="font-size:14px;margin-top:24px">Transactions</h3>
      <table class="invoice-table"><thead><tr><th>ID</th><th>Description</th><th>Date</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rows}</tbody></table>
    `;
    const html = buildReceiptHtml({ title: "Financial Report", companyName, bodyHtml });
    openPrintWindow(html, "Financial Report");
  }

  if (loading) return <p className="py-8 text-center text-sm text-neutral-400">Loading financial data...</p>;
  if (!data) return <p className="py-8 text-center text-sm text-neutral-400">Failed to load financial data.</p>;

  const { totalIncome, totalExpenses, netProfit, recentTransactions } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Financials</h1>
          <p className="mt-1 text-sm text-neutral-500">Income, expenses, and profitability overview.</p>
        </div>
        <Button variant="outline" onClick={handlePrintReport}>
          <Download className="mr-2 h-4 w-4" /> Report
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-danger">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">{formatCurrency(netProfit)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">ID</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Description</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {recentTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{t.id.substring(0, 8).toUpperCase()}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-900">{t.description || t.asset?.title || "—"}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{formatDate(t.date)}</td>
                      <td className={`px-3 py-2 md:px-4 md:py-3 font-mono ${t.category === "INCOME" ? "text-success" : "text-danger"}`}>
                        {t.category === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
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
