"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

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

export default function ClientBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showExtend, setShowExtend] = useState(false);
  const [extendDate, setExtendDate] = useState("");

  const fetchBooking = async () => {
    setError("");
    try {
      const res = await fetch(`/api/bookings/${params.id}`);
      const json = await res.json();
      if (json.success) {
        setBooking(json.data);
      } else if (res.status === 404) {
        setError("Booking not found");
      } else {
        setError(json.error || "Failed to load booking");
      }
    } catch {
      setError("An error occurred while loading the booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setBooking(json.data);
        toast("Booking updated", { variant: "success" });
      } else {
        toast(json.error || "Failed to update", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  async function fileDispute() {
    if (disputeReason.trim().length < 10) {
      toast("Please provide a detailed reason (min 10 characters)", { variant: "error" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disputeReason }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Dispute filed", { variant: "success" });
        setShowDispute(false);
        setDisputeReason("");
        fetchBooking();
      } else {
        toast(json.error || "Failed to file dispute", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function submitReview() {
    if (reviewRating < 1) { toast("Please select a rating", { variant: "error" }); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Review submitted", { variant: "success" });
        setReviewRating(0);
        setReviewComment("");
      } else {
        toast(json.error || "Failed to submit review", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function extendBooking() {
    if (!extendDate) { toast("Select a new end date", { variant: "error" }); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/extend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEndDate: extendDate }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Booking extended", { variant: "success" });
        setShowExtend(false);
        setExtendDate("");
        fetchBooking();
      } else {
        toast(json.error || "Failed to extend", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-neutral-400">Loading booking...</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-danger">{error}</p>;
  }

  if (!booking) {
    return <p className="py-8 text-center text-sm text-danger">Booking not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Booking Detail</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Reference: <span className="font-mono">{booking.id}</span>
          </p>
        </div>
        <Badge variant={statusBadge[booking.status] || "default"}>
          {statusLabel[booking.status] || booking.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Title</span>
              <span className="font-medium text-neutral-900">{booking.asset.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Type</span>
              <span className="text-neutral-900">{booking.asset.type}</span>
            </div>
            {booking.asset.plateNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Plate Number</span>
                <span className="font-mono text-neutral-900">{booking.asset.plateNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Name</span>
              <span className="font-medium text-neutral-900">{booking.owner.fullName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Email</span>
              <span className="text-neutral-900">{booking.owner.email}</span>
            </div>
            {booking.owner.phone && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Phone</span>
                <span className="text-neutral-900">{booking.owner.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">Start Date</p>
              <p className="text-sm font-medium text-neutral-900">
                {new Date(booking.startDate).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">End Date</p>
              <p className="text-sm font-medium text-neutral-900">
                {new Date(booking.endDate).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">Amount</p>
              <p className="text-sm font-mono font-medium text-success">
                ₦{booking.totalCost.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-neutral-500">Status</p>
              <Badge variant={statusBadge[booking.status] || "default"}>
                {statusLabel[booking.status] || booking.status}
              </Badge>
            </div>
            {booking.purpose && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Purpose</p>
                <p className="text-sm text-neutral-900">{booking.purpose}</p>
              </div>
            )}
            {booking.pickupLocation && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Pickup Location</p>
                <p className="text-sm text-neutral-900">{booking.pickupLocation}</p>
              </div>
            )}
            {booking.dropoffLocation && (
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Dropoff Location</p>
                <p className="text-sm text-neutral-900">{booking.dropoffLocation}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {booking.ownerNote && (
        <Card>
          <CardHeader>
            <CardTitle>Owner Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700">{booking.ownerNote}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {booking.status === "PENDING" && (
              <Button variant="destructive" onClick={() => updateStatus("CANCELLED")} disabled={actionLoading}>
                Cancel Booking
              </Button>
            )}
            {booking.status === "ACCEPTED" && (
              <Button variant="destructive" onClick={() => updateStatus("CANCELLED")} disabled={actionLoading}>
                Cancel Booking
              </Button>
            )}
            {["ACCEPTED", "IN_PROGRESS"].includes(booking.status) && (
              <>
                <Button variant="outline" onClick={() => setShowExtend(!showExtend)} disabled={actionLoading}>
                  {showExtend ? "Cancel" : "Extend Booking"}
                </Button>
                {showExtend && (
                  <div className="w-full flex gap-2 items-end">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">New End Date</label>
                      <input type="date" value={extendDate} min={new Date(booking.endDate).toISOString().split("T")[0]}
                        onChange={(e) => setExtendDate(e.target.value)}
                        className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                    </div>
                    <Button size="sm" onClick={extendBooking} disabled={actionLoading}>Confirm</Button>
                  </div>
                )}
              </>
            )}
            {["IN_PROGRESS", "COMPLETED", "DISPUTED"].includes(booking.status) && (
              <Link href={`/dashboard/client/bookings/${booking.id}/invoice`}>
                <Button variant="outline">View Invoice</Button>
              </Link>
            )}
            {["IN_PROGRESS"].includes(booking.status) && (
              <Button variant="destructive" onClick={() => setShowDispute(true)} disabled={actionLoading}>
                Open Dispute
              </Button>
            )}
            {["REJECTED", "CANCELLED"].includes(booking.status) && (
              <p className="text-sm text-neutral-400">This booking is {booking.status.toLowerCase()}.</p>
            )}
          </div>

          {showDispute && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">Why are you opening a dispute?</p>
              <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={3}
                placeholder="Describe the issue in detail..."
                className="mt-2 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm" />
              <div className="mt-3 flex gap-2">
                <Button variant="destructive" size="sm" onClick={fileDispute} disabled={actionLoading}>
                  {actionLoading ? "Submitting..." : "Submit Dispute"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowDispute(false); setDisputeReason(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {booking.status === "COMPLETED" && (
        <Card>
          <CardHeader>
            <CardTitle>Leave a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setReviewRating(star)}
                  className={`text-2xl ${star <= reviewRating ? "text-amber-400" : "text-neutral-300"} hover:text-amber-400 transition-colors`}>
                  &#9733;
                </button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={2}
              placeholder="Share your experience (optional)"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
            <Button className="mt-3" onClick={submitReview} disabled={actionLoading || reviewRating < 1}>
              {actionLoading ? "Submitting..." : "Submit Review"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
