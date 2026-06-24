"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  function load(p: number) {
    setLoading(true);
    fetch(`/api/notifications?page=${p}&limit=20`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setNotifications(res.data);
          setUnreadCount(res.unreadCount);
          setTotalPages(res.pagination.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(page); }, [page]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      load(page);
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-12 text-center text-sm text-neutral-400">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-400">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-4 md:px-6 ${!n.read ? "bg-accent/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-neutral-900">{n.title}</p>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      {n.message && (
                        <p className="mt-1 text-sm text-neutral-600">{n.message}</p>
                      )}
                      <p className="mt-1.5 text-xs text-neutral-400">{formatDateTime(n.createdAt)}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {n.link && (
                        <Link
                          href={n.link}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
