"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  createdAt: string;
  closedAt: string | null;
  resolvedAt: string | null;
  creator: { id: string; fullName: string; email: string; role: string };
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

export default function OwnerTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/support/${params.id}`);
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

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyText("");
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    setClosing(true);
    try {
      const res = await fetch(`/api/support/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      const json = await res.json();
      if (json.success) setTicket(json.data);
    } catch (err) {
      console.error("Failed to close ticket", err);
    } finally {
      setClosing(false);
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

      <div className="flex flex-wrap gap-2">
        {ticket.category && (
          <Badge variant="secondary">{ticket.category}</Badge>
        )}
        <Badge variant={priorityBadge[ticket.priority] || "secondary"}>
          {ticket.priority}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.messages.length === 0 && (
            <p className="text-sm text-neutral-400">No messages yet.</p>
          )}
          {ticket.messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">
                    {msg.sender.fullName}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {msg.sender.role}
                  </Badge>
                </div>
                <span className="text-xs text-neutral-400">
                  {new Date(msg.createdAt).toLocaleString("en-NG", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-neutral-700">{msg.message}</p>
            </div>
          ))}
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
            <div className="flex gap-3">
              <Button onClick={sendReply} disabled={sending || !replyText.trim()}>
                {sending ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {ticket.creatorId === ticket.creator.id && ticket.status !== "CLOSED" && (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={closeTicket} disabled={closing}>
            {closing ? "Closing..." : "Close Ticket"}
          </Button>
        </div>
      )}
    </div>
  );
}
