"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Booking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  asset: { id: string; title: string; type: string };
  client: { id: string; fullName: string; email: string };
  owner: { id: string; fullName: string; email: string };
}

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  IN_PROGRESS: "success",
  COMPLETED: "secondary",
  PENDING: "warning",
  CANCELLED: "destructive",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  IN_PROGRESS: "Active",
  COMPLETED: "Completed",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  function load(p: number) {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", "10");
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setBookings(res.data);
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
        }
      })
      .catch((e) => console.error("admin bookings: fetch failed", e))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1); }, [statusFilter]);

  function handlePageChange(p: number) {
    setPage(p);
    load(p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Bookings</h1>
        <p className="mt-1 text-sm text-neutral-500">Monitor all booking transactions across the platform.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Bookings</CardTitle>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">ID</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Asset</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Client</th>
                  <th className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Owner</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Dates</th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-400">Loading...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-400">No bookings found</td></tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-neutral-50">
                      <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 font-mono text-sm text-neutral-500">
                        {booking.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm font-medium text-neutral-900">{booking.asset.title}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{booking.client.fullName}</td>
                      <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{booking.owner.fullName}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusVariant[booking.status] ?? "secondary"}>
                          {statusLabel[booking.status] ?? booking.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right font-mono text-sm font-semibold text-neutral-900">
                        {formatCurrency(Number(booking.totalCost))}
                      </td>
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
