"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

interface WalletInfo {
  id: string;
  balance: number;
  accountName: string | null;
  nubanAccountNumber: string | null;
  bankName: string | null;
  currency: string;
}

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: boolean | null;
  phoneVerified: boolean | null;
  bankCode: string | null;
  bankAccountNumber: string | null;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  wallet: WalletInfo | null;
  _count: {
    assets: number;
    bookingsAsOwner: number;
    bookingsAsClient: number;
    sessions: number;
    tickets: number;
  };
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showWalletAdjust, setShowWalletAdjust] = useState(false);
  const [adjType, setAdjType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [changingRole, setChangingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setUser(res.data); })
      .catch((e) => console.error("fetch user failed", e))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function updateUser(action: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message || `User ${action}d`, { variant: "success" });
        setUser((prev) => prev ? {
          ...prev,
          status: action === "disable" ? "SUSPENDED" : "ACTIVE",
          deactivatedAt: action === "disable" ? new Date().toISOString() : null,
        } : prev);
      } else {
        toast(data.error || "Action failed", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function forceLogout() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) toast(`Sessions deleted: ${data.data.sessionsDeleted}`, { variant: "success" });
      else toast(data.error || "Logout failed", { variant: "error" });
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function reset2FA() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}/reset-2fa`, { method: "POST" });
      const data = await res.json();
      if (data.success) toast(data.message, { variant: "success" });
      else toast(data.error || "Failed to reset 2FA", { variant: "error" });
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function adjustWallet() {
    const amount = parseFloat(adjAmount);
    if (!amount || amount <= 0) { toast("Enter a valid amount", { variant: "error" }); return; }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, amount, type: adjType, reason: adjReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message, { variant: "success" });
        setShowWalletAdjust(false);
        setAdjAmount("");
        setAdjReason("");
      } else {
        toast(data.error || "Adjustment failed", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function changeRole() {
    if (!selectedRole || selectedRole === user!.role) return;
    setChangingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changeRole", role: selectedRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Role changed to ${selectedRole}`, { variant: "success" });
        setUser((prev) => prev ? { ...prev, role: selectedRole } : prev);
      } else {
        toast(data.error || "Failed to change role", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setChangingRole(false);
    }
  }

  if (loading) return <p className="py-8 text-center text-sm text-neutral-400">Loading user...</p>;
  if (!user) return <p className="py-8 text-center text-sm text-danger">User not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{user.fullName}</h1>
          <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/users")}>Back to Users</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Role</span>
              <div className="flex items-center gap-2">
                <Badge>{user.role}</Badge>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[11px]"
                >
                  <option value="">Change</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="OWNER">OWNER</option>
                  <option value="CLIENT">CLIENT</option>
                </select>
                {selectedRole && selectedRole !== user.role && (
                  <Button size="sm" onClick={changeRole} disabled={changingRole} className="text-[11px] h-6 px-2">
                    {changingRole ? "..." : "Set"}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-between"><span className="text-neutral-500">Status</span>
              <Badge variant={user.status === "ACTIVE" ? "success" : "destructive"}>{user.status}</Badge>
            </div>
            <div className="flex justify-between"><span className="text-neutral-500">Email Verified</span><span>{user.emailVerified ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Phone Verified</span><span>{user.phoneVerified ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Registered</span><span>{formatDate(user.createdAt)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Wallet</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {user.wallet ? (
              <>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Balance</span>
                  <span className="font-mono font-bold text-success">
                    {user.wallet.currency === "NGN" ? "₦" : "$"}{Number(user.wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-neutral-500">NUBAN</span><span className="font-mono">{user.wallet.nubanAccountNumber || "—"}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Bank</span><span>{user.wallet.bankName || "—"}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Account Name</span><span className="text-right max-w-[180px] truncate">{user.wallet.accountName || "—"}</span></div>
              </>
            ) : (
              <p className="text-neutral-400">No wallet found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Listings</span><span className="font-medium">{user._count.assets}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Bookings (Owner)</span><span className="font-medium">{user._count.bookingsAsOwner}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Bookings (Client)</span><span className="font-medium">{user._count.bookingsAsClient}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Support Tickets</span><span className="font-medium">{user._count.tickets}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Active Sessions</span><span className="font-medium">{user._count.sessions}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {user.role !== "ADMIN" && (
              <Button onClick={() => updateUser(user.status === "ACTIVE" ? "disable" : "enable")}
                disabled={actionLoading} className="w-full" variant={user.status === "ACTIVE" ? "destructive" : "default"}>
                {actionLoading ? "Processing..." : user.status === "ACTIVE" ? "Suspend User" : "Reinstate User"}
              </Button>
            )}
            {user._count.sessions > 0 && (
              <Button onClick={forceLogout} disabled={actionLoading} variant="outline" className="w-full">
                Force Logout ({user._count.sessions} sessions)
              </Button>
            )}
            <Button onClick={reset2FA} disabled={actionLoading} variant="outline" className="w-full">
              Reset 2FA
            </Button>
            <Button onClick={() => setShowWalletAdjust(!showWalletAdjust)} variant="outline" className="w-full">
              {showWalletAdjust ? "Cancel" : "Adjust Wallet"}
            </Button>
            {showWalletAdjust && (
              <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
                <select value={adjType} onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm">
                  <option value="CREDIT">Credit (Add funds)</option>
                  <option value="DEBIT">Debit (Remove funds)</option>
                </select>
                <input type="number" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)}
                  placeholder="Amount" className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm" />
                <input type="text" value={adjReason} onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Reason (optional)" className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm" />
                <Button size="sm" onClick={adjustWallet} disabled={actionLoading} className="w-full">
                  {actionLoading ? "Processing..." : "Apply"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
