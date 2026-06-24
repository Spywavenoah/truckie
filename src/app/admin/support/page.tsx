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
  creator: { id: string; fullName: string; email: string; role: string };
  _count: { messages: number };
}

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  LOW: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive" | "default"> = {
  OPEN: "warning",
  IN_PROGRESS: "default",
  RESOLVED: "success",
  CLOSED: "secondary",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    fetch(`/api/admin/support?${params}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setTickets(res.data); })
      .catch((e) => console.error("admin support: fetch failed", e))
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Support</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage support tickets from platform users.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tickets</CardTitle>
          <div className="flex gap-2">
            <select className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priority</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No tickets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Ticket</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Creator</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Subject</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Priority</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-sm text-neutral-700">{ticket.id.substring(0, 8).toUpperCase()}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{ticket.creator.fullName}<br/><span className="text-xs text-neutral-400">{ticket.creator.role}</span></td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm font-medium text-neutral-900">{ticket.subject}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityColors[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusVariant[ticket.status] ?? "secondary"}>{formatStatus(ticket.status)}</Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Link href={`/admin/support/${ticket.id}`}><Button variant="outline" size="sm">View</Button></Link>
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
