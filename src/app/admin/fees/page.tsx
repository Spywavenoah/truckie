"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/pagination";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface FeeTransaction {
  id: string;
  category: string;
  subCategory: string | null;
  description: string | null;
  amount: number;
  reference: string | null;
  date: string;
  owner: { id: string; fullName: string; email: string };
  asset: { id: string; title: string } | null;
  booking: { id: string; status: string } | null;
}

export default function AdminFeesPage() {
  const [fees, setFees] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFees, setTotalFees] = useState(0);
  const [search, setSearch] = useState("");

  function load(p: number, s?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", "20");
    params.set("category", "FEE");
    const q = s ?? search;
    if (q) params.set("search", q);

    fetch(`/api/admin/transactions?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setFees(res.data);
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
          setTotalFees(res.data.reduce((sum: number, t: FeeTransaction) => sum + Number(t.amount), 0));
        }
      })
      .catch((e) => console.error("admin fees: fetch failed", e))
      .finally(() => setLoading(false));
  }

  useEffect(() => { setPage(1); load(1); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1);
  }

  function handlePageChange(p: number) {
    setPage(p);
    load(p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Platform Fees</h1>
        <p className="mt-1 text-sm text-neutral-500">All platform fees collected from bookings and sales.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Fees (this page)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{formatCurrency(totalFees)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{fees.length > 0 ? `Page ${page} of ${totalPages}` : "0"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Search</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice (reference)..."
                className="flex-1 rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 placeholder:text-neutral-400"
              />
              <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90">
                Search
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fee Transactions</CardTitle>
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); load(1, ""); }}
              className="text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Owner</th>
                  <th className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Description</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Reference</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Amount</th>
                  <th className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">Loading...</td></tr>
                ) : fees.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">No fees found</td></tr>
                ) : (
                  fees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm font-medium text-neutral-900">{fee.owner.fullName}</td>
                      <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600 max-w-[240px] truncate">{fee.description || "—"}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{fee.reference || "—"}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right font-mono text-sm font-semibold text-success">
                        {formatCurrency(Number(fee.amount))}
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-500">{formatDateTime(fee.date)}</td>
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
