"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Ticket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  _count: { messages: number };
}

const statusBadge: Record<string, "warning" | "default" | "success" | "secondary"> = {
  OPEN: "warning",
  IN_PROGRESS: "default",
  RESOLVED: "success",
  CLOSED: "secondary",
};

const priorityBadge: Record<string, "destructive" | "warning" | "secondary"> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((res) => { if (res.success) setTickets(res.data); })
      .catch((e) => console.error("owner support: fetch failed", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Support</h1>
          <p className="mt-1 text-sm text-neutral-500">Your support tickets and inquiries.</p>
        </div>
        <Link href="/dashboard/owner/support/new"><Button>New Ticket</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No support tickets yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Ticket ID</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Subject</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Priority</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Status</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{t.id.substring(0, 8).toUpperCase()}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-neutral-900">{t.subject}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={priorityBadge[t.priority] || "secondary"}>{formatStatus(t.priority)}</Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusBadge[t.status] || "secondary"}>{formatStatus(t.status)}</Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Link href={`/dashboard/owner/support/${t.id}`}><Button variant="outline" size="sm">View</Button></Link>
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
