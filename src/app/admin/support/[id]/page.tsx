"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

interface TicketMessage {
  id: string;
  message: string | null;
  createdAt: string;
  sender: { id: string; fullName: string; role: string };
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string | null;
  priority: string;
  status: string;
  creatorId: string;
  assignedTo: string | null;
  assignedToUser: { id: string; fullName: string; email: string; role: string } | null;
  slaDeadline: string | null;
  escalatedAt: string | null;
  escalatedBy: string | null;
  escalationReason: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  creator: { id: string; fullName: string; email: string; role: string; phone: string | null };
  messages: TicketMessage[];
}

const statusBadge: Record<string, "warning" | "default" | "success" | "secondary" | "destructive"> = {
  OPEN: "warning",
  IN_PROGRESS: "default",
  ESCALATED: "destructive",
  RESOLVED: "success",
  CLOSED: "secondary",
};

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const priorityBadge: Record<string, "destructive" | "warning" | "secondary"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [slaRemaining, setSlaRemaining] = useState("");

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/admin/support/${params.id}`);
      const json = await res.json();
      if (json.success) setTicket(json.data);
    } catch (err) {
      console.error("Failed to fetch ticket", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

  useEffect(() => {
    const deadline = ticket?.slaDeadline;
    if (!deadline) { setSlaRemaining(""); return; }
    const updateSla = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setSlaRemaining("OVERDUE"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setSlaRemaining(`${h}h ${m}m`);
    };
    updateSla();
    const interval = setInterval(updateSla, 60000);
    return () => clearInterval(interval);
  }, [ticket?.slaDeadline]);

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
          const res = await fetch(`/api/admin/support/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyText("");
        fetchTicket();
        toast("Reply sent", { variant: "success" });
      }
    } catch (err) {
      console.error("Failed to send reply", err);
      toast("Failed to send reply", { variant: "error" });
    } finally {
      setSending(false);
    }
  };

  const assignToSelf = async () => {
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/admin/support/${params.id}/assign`, { method: "PATCH" });
      const json = await res.json();
      if (json.success) { fetchTicket(); toast("Ticket assigned", { variant: "success" }); }
    } catch (err) {
      console.error("Failed to assign ticket", err);
      toast("Failed to assign ticket", { variant: "error" });
    } finally {
      setAssignLoading(false);
    }
  };

  const escalate = async () => {
    if (!escalateReason.trim()) return;
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/admin/support/${params.id}/escalate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalationReason: escalateReason }),
      });
      const json = await res.json();
      if (json.success) {
        fetchTicket();
        setShowEscalate(false);
        setEscalateReason("");
        toast("Ticket escalated", { variant: "success" });
      }
    } catch (err) {
      console.error("Failed to escalate ticket", err);
      toast("Failed to escalate ticket", { variant: "error" });
    } finally {
      setAssignLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/support/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) { fetchTicket(); toast(`Ticket ${(statusLabel[status] || status).toLowerCase()}`, { variant: "success" }); }
    } catch (err) {
      console.error("Failed to update status", err);
      toast("Failed to update status", { variant: "error" });
    } finally {
      setStatusUpdating(false);
    }
  };

  const updatePriority = async (priority: string) => {
    try {
      const res = await fetch(`/api/admin/support/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      const json = await res.json();
      if (json.success) { fetchTicket(); toast(`Priority updated to ${priority}`, { variant: "success" }); }
    } catch (err) {
      console.error("Failed to update priority", err);
      toast("Failed to update priority", { variant: "error" });
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-neutral-400">Loading ticket...</p>;
  }

  if (!ticket) {
    return <p className="py-8 text-center text-sm text-danger">Ticket not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Ticket: <span className="font-mono">{ticket.ticketNumber}</span>
          </p>
        </div>
        <Badge variant={statusBadge[ticket.status] || "secondary"}>
          {statusLabel[ticket.status] || ticket.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Category</span>
              <span className="font-medium text-neutral-900">{ticket.category || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Priority</span>
              <Badge variant={priorityBadge[ticket.priority] || "secondary"}>{ticket.priority}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Assigned To</span>
              <span className="font-medium text-neutral-900">
                {ticket.assignedToUser?.fullName || "Unassigned"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Created</span>
              <span className="font-medium text-neutral-900">
                {new Date(ticket.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </div>
            {ticket.slaDeadline && (
              <div className="flex justify-between">
                <span className="text-neutral-500">SLA</span>
                <span className={`font-medium ${slaRemaining === "OVERDUE" ? "text-red-600" : "text-amber-600"}`}>
                  {slaRemaining}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Creator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Name</span>
              <span className="font-medium text-neutral-900">{ticket.creator.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Email</span>
              <span className="font-medium text-neutral-900">{ticket.creator.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Role</span>
              <Badge variant="secondary">{ticket.creator.role}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!ticket.assignedTo && (
              <Button onClick={assignToSelf} disabled={assignLoading} className="w-full">
                {assignLoading ? "Assigning..." : "Assign to Me"}
              </Button>
            )}

            <select
              value={ticket.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={statusUpdating}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={ticket.priority}
              onChange={(e) => updatePriority(e.target.value)}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {!showEscalate && ticket.status !== "ESCALATED" && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
              <Button variant="outline" onClick={() => setShowEscalate(true)} className="w-full">
                Escalate
              </Button>
            )}

            {showEscalate && (
              <div className="space-y-2">
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Reason for escalation"
                  rows={2}
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
                />
                <div className="flex gap-2">
                  <Button onClick={escalate} disabled={assignLoading || !escalateReason.trim()}>
                    Confirm Escalate
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowEscalate(false); setEscalateReason(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-y-auto p-4">
          {ticket.messages.length === 0 && (
            <p className="text-sm text-neutral-400 text-center py-8">No messages yet.</p>
          )}
          {ticket.messages.map((msg) => {
            const isAdmin = msg.sender.role === "ADMIN";
            return (
              <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                  isAdmin
                    ? "bg-accent/10 text-neutral-900 rounded-br-sm"
                    : "bg-neutral-100 text-neutral-900 rounded-bl-sm"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-neutral-600">{isAdmin ? "Admin" : msg.sender.fullName}</span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(msg.createdAt).toLocaleString("en-NG", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {ticket.status !== "CLOSED" && (
        <Card>
          <CardHeader>
            <CardTitle>Reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows={3}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            />
            <Button onClick={sendReply} disabled={sending || !replyText.trim()}>
              {sending ? "Sending..." : "Send Reply"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
