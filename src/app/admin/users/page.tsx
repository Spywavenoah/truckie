"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";
import { toast } from "@/components/ui/toaster";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  _count: { assets: number; bookingsAsOwner: number; bookingsAsClient: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function load(p?: number) {
    const pn = p ?? page;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(pn));
    params.set("limit", "10");
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUsers(res.data);
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
        }
      })
      .catch((e) => console.error("admin users: fetch failed", e))
      .finally(() => setLoading(false));
  }

  function handlePageChange(p: number) {
    setPage(p);
    load(p);
  }

  async function toggleSuspend(userId: string, currentStatus: string) {
    const action = currentStatus === "ACTIVE" ? "disable" : "enable";
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message || `User ${action}d`, { variant: "success" });
        load();
      } else {
        toast(data.error || "Action failed", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    }
  }

  useEffect(() => {
    setPage(1);
    load(1);
  }, [search, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage all platform users and their access.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Users</CardTitle>
          <div className="flex gap-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 placeholder:text-neutral-400 w-48" />
            <select className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="CLIENT">Renter</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DEACTIVATED">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Name</th>
                    <th className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Email</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Role</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Assets</th>
                    <th className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Bookings</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm font-medium text-neutral-900">{user.fullName}</td>
                      <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{user.email}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-700">
                        {user.role === "OWNER" ? "Owner" : user.role === "CLIENT" ? "Renter" : "Admin"}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "destructive" : "secondary"}>
                          {user.status === "ACTIVE" ? "Active" : user.status === "SUSPENDED" ? "Suspended" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{user._count.assets}</td>
                      <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{user._count.bookingsAsOwner + user._count.bookingsAsClient}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right flex gap-2 justify-end">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => toggleSuspend(user.id, user.status)}>
                          {user.status === "ACTIVE" ? "Suspend" : "Reinstate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {users.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
