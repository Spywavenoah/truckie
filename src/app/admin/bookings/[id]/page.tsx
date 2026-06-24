"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { Printer } from "lucide-react";

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  currency: string;
  status: string;
  purpose: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  clientNote: string | null;
  ownerNote: string | null;
  createdAt: string;
  asset: { id: string; title: string; type: string; plateNumber: string | null };
  client: { id: string; fullName: string; email: string; phone: string | null };
  owner: { id: string; fullName: string; email: string; phone: string | null };
}

const statusBadge: Record<string, "success" | "default" | "secondary" | "destructive" | "warning" | "outline"> = {
  PENDING: "warning",
  ACCEPTED: "default",
  REJECTED: "destructive",
  IN_PROGRESS: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  DISPUTED: "destructive",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

export default function AdminBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/bookings/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setBooking(res.data);
        else setError(res.error || "Failed to load");
      })
      .catch(() => setError("Failed to load booking"))
      .finally(() => setLoading(false));
  }, [params.id]);

  function handlePrint() {
    const printWin = window.open("", "_blank");
    if (!printWin || !booking) return;
    printWin.document.write(`
      <html><head><title>Booking #${booking.id.slice(0, 8).toUpperCase()}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 40px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 6px 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        h1 { font-size: 20px; }
        .section { margin: 20px 0; }
      </style></head><body>
      <h1>Booking #${booking.id.slice(0, 8).toUpperCase()}</h1>
      <p>Status: ${statusLabel[booking.status] || booking.status}</p>
      <div class="section">
        <h3>Asset</h3>
        <p>${booking.asset.title} (${booking.asset.type})${booking.asset.plateNumber ? " - " + booking.asset.plateNumber : ""}</p>
      </div>
      <div class="section">
        <h3>Client</h3>
        <p>${booking.client.fullName}<br>${booking.client.email}${booking.client.phone ? "<br>" + booking.client.phone : ""}</p>
      </div>
      <div class="section">
        <h3>Owner</h3>
        <p>${booking.owner.fullName}<br>${booking.owner.email}${booking.owner.phone ? "<br>" + booking.owner.phone : ""}</p>
      </div>
      <div class="section">
        <h3>Booking Details</h3>
        <p>Start: ${new Date(booking.startDate).toLocaleDateString()}</p>
        <p>End: ${new Date(booking.endDate).toLocaleDateString()}</p>
        <p>Amount: ₦${booking.totalCost.toLocaleString()}</p>
        ${booking.purpose ? "<p>Purpose: " + booking.purpose + "</p>" : ""}
        ${booking.pickupLocation ? "<p>Pickup: " + booking.pickupLocation + "</p>" : ""}
        ${booking.dropoffLocation ? "<p>Dropoff: " + booking.dropoffLocation + "</p>" : ""}
      </div>
      <p style="margin-top:40px;color:#999;font-size:11px">TruckLease Pro — Admin Portal</p>
      </body></html>
    `);
    printWin.document.close();
    printWin.print();
  }

  if (loading) return <p className="py-8 text-center text-sm text-neutral-400">Loading booking...</p>;
  if (error) return <p className="py-8 text-center text-sm text-danger">{error}</p>;
  if (!booking) return <p className="py-8 text-center text-sm text-danger">Booking not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Booking Detail</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Reference: <span className="font-mono">{booking.id}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/bookings")}>Back</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Asset Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Title</span>
              <span className="font-medium">{booking.asset.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Type</span>
              <span>{booking.asset.type}</span>
            </div>
            {booking.asset.plateNumber && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Plate</span>
                <span className="font-mono">{booking.asset.plateNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Client</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Name</span>
              <span className="font-medium">{booking.client.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Email</span>
              <span>{booking.client.email}</span>
            </div>
            {booking.client.phone && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Phone</span>
                <span>{booking.client.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Owner</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Name</span>
              <span className="font-medium">{booking.owner.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Email</span>
              <span>{booking.owner.email}</span>
            </div>
            {booking.owner.phone && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Phone</span>
                <span>{booking.owner.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">Start Date</p>
              <p className="text-sm font-medium">{new Date(booking.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">End Date</p>
              <p className="text-sm font-medium">{new Date(booking.endDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">Amount</p>
              <p className="text-sm font-mono font-bold text-success">₦{booking.totalCost.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">Status</p>
              <Badge variant={statusBadge[booking.status] || "default"}>{statusLabel[booking.status] || booking.status}</Badge>
            </div>
            {booking.purpose && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Purpose</p>
                <p className="text-sm">{booking.purpose}</p>
              </div>
            )}
            {booking.pickupLocation && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Pickup</p>
                <p className="text-sm">{booking.pickupLocation}</p>
              </div>
            )}
            {booking.dropoffLocation && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Dropoff</p>
                <p className="text-sm">{booking.dropoffLocation}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {booking.clientNote && (
        <Card>
          <CardHeader><CardTitle>Client Note</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{booking.clientNote}</p></CardContent>
        </Card>
      )}

      {booking.ownerNote && (
        <Card>
          <CardHeader><CardTitle>Owner Note</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{booking.ownerNote}</p></CardContent>
        </Card>
      )}

      <div className="text-xs text-neutral-400">
        Created: {new Date(booking.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
