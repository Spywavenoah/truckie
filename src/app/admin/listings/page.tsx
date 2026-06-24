"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";
import { toast } from "@/components/ui/toaster";

interface Asset {
  id: string;
  title: string;
  type: string;
  pricePerDay: number | null;
  pricePerHour: number | null;
  pricePerTon: number | null;
  availabilityStatus: string;
  isApproved: boolean;
  owner: { fullName: string };
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  function load(p?: number) {
    const pn = p ?? page;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(pn));
    params.set("limit", "10");
    if (typeFilter) params.set("type", typeFilter);
    if (approvalFilter === "approved") params.set("isApproved", "true");
    else if (approvalFilter === "pending") params.set("isApproved", "false");
    fetch(`/api/admin/listings?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setListings(res.data);
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
        }
      })
      .catch((e) => console.error("admin listings: fetch failed", e))
      .finally(() => setLoading(false));
  }

  function handlePageChange(p: number) {
    setPage(p);
    load(p);
  }

  async function updateApproval(id: string, action: string) {
    try {
      const res = await fetch(`/api/admin/listings/${id}/${action}`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) {
        toast(data.message || `Listing ${action}d`, { variant: "success" });
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
  }, [typeFilter, approvalFilter]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === listings.length) setSelected(new Set());
    else setSelected(new Set(listings.map((l) => l.id)));
  }

  async function bulkApprove() {
    if (selected.size === 0) { toast("No listings selected", { variant: "error" }); return; }
    setBulkLoading(true);
    let count = 0;
    for (const id of selected) {
      try {
        const res = await fetch(`/api/admin/listings/${id}/approve`, { method: "PATCH" });
        const data = await res.json();
        if (data.success) count++;
      } catch {}
    }
    toast(`${count} of ${selected.size} approved`, { variant: "success" });
    setSelected(new Set());
    setBulkLoading(false);
    load();
  }

  function downloadCSV() {
    const headers = ["Title", "Owner", "Type", "Price", "Status", "Approval"];
    const rows = listings.map((l) => [
      l.title,
      l.owner.fullName,
      l.type,
      l.pricePerDay ? `${l.pricePerDay}/day` : l.pricePerHour ? `${l.pricePerHour}/hr` : l.pricePerTon ? `${l.pricePerTon}/ton` : "—",
      l.availabilityStatus,
      l.isApproved ? "Approved" : "Pending",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "listings.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Listings</h1>
        <p className="mt-1 text-sm text-neutral-500">Review and manage all asset listings on the platform.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Listings</CardTitle>
          <div className="flex gap-2">
            <select className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="TRUCK">Truck</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="MATERIAL">Material</option>
            </select>
            <select className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700" value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
              <option value="">All Approval</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
            <Button variant="outline" size="sm" onClick={downloadCSV}>CSV</Button>
            {selected.size > 0 && (
              <Button size="sm" onClick={bulkApprove} disabled={bulkLoading}>
                {bulkLoading ? "..." : `Approve ${selected.size}`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">Loading listings...</p>
          ) : listings.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No listings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="w-10 px-3 py-2 md:px-4 md:py-3">
                      <input type="checkbox" checked={selected.size === listings.length && listings.length > 0} onChange={toggleAll}
                        className="rounded border-neutral-300" />
                    </th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Title</th>
                    <th className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Owner</th>
                    <th className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Type</th>
                    <th className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Price</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Approval</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <input type="checkbox" checked={selected.has(listing.id)} onChange={() => toggleSelect(listing.id)}
                          className="rounded border-neutral-300" />
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm font-medium text-neutral-900">{listing.title}</td>
                      <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{listing.owner.fullName}</td>
                      <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-700">{listing.type}</td>
                      <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600 font-mono">
                        {listing.pricePerDay ? `₦${listing.pricePerDay.toLocaleString()}/day` : listing.pricePerHour ? `₦${listing.pricePerHour.toLocaleString()}/hr` : listing.pricePerTon ? `₦${listing.pricePerTon.toLocaleString()}/ton` : "—"}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={listing.availabilityStatus === "AVAILABLE" || listing.availabilityStatus === "HIRED" ? "success" : "secondary"}>
                          {listing.availabilityStatus === "AVAILABLE" ? "Available" : listing.availabilityStatus === "HIRED" ? "Hired" : listing.availabilityStatus === "MAINTENANCE" ? "Maintenance" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={listing.isApproved ? "success" : "warning"}>
                          {listing.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {listing.isApproved ? (
                            <Button variant="outline" size="sm" onClick={() => updateApproval(listing.id, "suspend")}>Suspend</Button>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" onClick={() => updateApproval(listing.id, "approve")}>Approve</Button>
                              <Button variant="ghost" size="sm" onClick={() => updateApproval(listing.id, "reject")}>Reject</Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {listings.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
