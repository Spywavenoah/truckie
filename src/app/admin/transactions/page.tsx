"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/pagination";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Transaction {
  id: string;
  category: string;
  subCategory: string | null;
  description: string | null;
  amount: number;
  currency: string;
  reference: string | null;
  date: string;
  owner: { id: string; fullName: string; email: string };
  asset: { id: string; title: string } | null;
  booking: { id: string; status: string } | null;
}

const categoryLabel: Record<string, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  FEE: "Fee",
};

const categoryVariant: Record<string, "success" | "destructive" | "secondary"> = {
  INCOME: "success",
  EXPENSE: "destructive",
  FEE: "secondary",
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");

  function load(p: number) {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", "15");
    if (categoryFilter) params.set("category", categoryFilter);

    fetch(`/api/admin/transactions?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setTransactions(res.data);
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
        }
      })
      .catch((e) => console.error("admin transactions: fetch failed", e))
      .finally(() => setLoading(false));
  }

  useEffect(() => { setPage(1); load(1); }, [categoryFilter]);

  function handlePageChange(p: number) {
    setPage(p);
    load(p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Transactions</h1>
        <p className="mt-1 text-sm text-neutral-500">View all financial transactions across the platform.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Transactions</CardTitle>
          <div className="flex gap-2">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700">
              <option value="">All Categories</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="FEE">Fee</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">User</th>
                  <th className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Description</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Category</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Amount</th>
                  <th className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">No transactions found</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm font-medium text-neutral-900">{tx.owner.fullName}</td>
                      <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600 max-w-[200px] truncate">
                        {tx.description || tx.asset?.title || "—"}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={categoryVariant[tx.category] ?? "secondary"}>
                          {categoryLabel[tx.category] ?? tx.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right font-mono text-sm font-semibold"
                        style={{ color: tx.category === "INCOME" ? "#16a34a" : tx.category === "EXPENSE" ? "#dc2626" : "inherit" }}>
                        {tx.category === "INCOME" ? "+" : tx.category === "EXPENSE" ? "−" : ""}{formatCurrency(tx.amount)}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-500">{formatDateTime(tx.date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="border-t border-neutral-200 px-4 py-3">
              <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
