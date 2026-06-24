"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

let audioCtx: AudioContext | null = null;

function playNotificationSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  } catch {}
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const prevUnread = useRef(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=5");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        if (json.unreadCount > prevUnread.current) {
          playNotificationSound();
        }
        prevUnread.current = json.unreadCount;
        setUnread(json.unreadCount);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
    let interval: ReturnType<typeof setInterval>;
    function startPoll() { interval = setInterval(fetchData, 30000); }
    function stopPoll() { clearInterval(interval); }
    startPoll();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopPoll(); else { fetchData(); startPoll(); }
    });
    return () => { stopPoll(); document.removeEventListener("visibilitychange", startPoll); };
  }, [fetchData]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function markRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      fetchData();
    } catch {}
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      fetchData();
    } catch {}
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-neutral-200 bg-white shadow-lg"
          role="menu"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <p className="text-sm font-medium text-neutral-900">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-accent hover:text-accent-light">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-400">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-neutral-50 px-4 py-3 transition-colors hover:bg-neutral-50 ${!n.read ? "bg-accent/5" : ""}`}
                  onClick={() => { if (!n.read) markRead(n.id); }}
                  role="menuitem"
                >
                  {n.link ? (
                    <Link href={n.link} className="block" onClick={() => setOpen(false)}>
                      <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                      {n.message && <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{n.message}</p>}
                      <p className="mt-1 text-[10px] text-neutral-400">{timeAgo(n.createdAt)}</p>
                    </Link>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                      {n.message && <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{n.message}</p>}
                      <p className="mt-1 text-[10px] text-neutral-400">{timeAgo(n.createdAt)}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <Link
            href="/dashboard/notifications"
            className="block border-t border-neutral-100 px-4 py-2.5 text-center text-xs font-medium text-accent hover:text-accent-light"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
