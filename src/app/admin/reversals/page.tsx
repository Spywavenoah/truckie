"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

interface ReversalRequest {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  requester: { fullName: string; email: string };
  booking: { id: string };
}

const statusVariant: Record<string, "warning" | "default" | "success" | "destructive"> = {
  PENDING: "warning",
  UNDER_REVIEW: "default",
  APPROVED: "success",
  REJECTED: "destructive",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminReversalsPage() {
  const [reversals, setReversals] = useState<ReversalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/admin/reversals")
      .then((r) => r.json())
      .then((res) => { if (res.success) setReversals(res.data); })
      .catch((e) => console.error("admin reversals: fetch failed", e))
      .finally(() => setLoading(false));
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/reversals/${id}/${status.toLowerCase()}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast(`Reversal ${status.toLowerCase()}`, { variant: "success" });
        load();
      } else {
        toast(data.error || "Action failed", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    }
  }

  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reversals</h1>
        <p className="mt-1 text-sm text-neutral-500">Review and resolve payment reversal requests.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reversal Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">Loading reversals...</p>
          ) : reversals.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No reversal requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Requester</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Amount</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Reason</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {reversals.map((rev) => (
                    <tr key={rev.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm font-medium text-neutral-900">{rev.requester.fullName}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-sm font-semibold text-neutral-900">₦{rev.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{rev.reason}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusVariant[rev.status] ?? "secondary"}>{formatStatus(rev.status)}</Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        {rev.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => updateStatus(rev.id, "APPROVED")}>Approve</Button>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(rev.id, "REJECTED")}>Reject</Button>
                          </div>
                        )}
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
