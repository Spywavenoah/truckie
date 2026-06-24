"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function OwnerBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Booking ${newStatus.toLowerCase()}`, { variant: "success" });
        router.refresh();
      } else {
        toast(data.error || "Action failed", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    }
  }

  if (status === "PENDING") {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => updateStatus("ACCEPTED")}>Accept</Button>
        <Button variant="ghost" size="sm" onClick={() => updateStatus("REJECTED")}>Decline</Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/owner/bookings/${bookingId}`)}>View</Button>
  );
}

export function ClientBookingActions({ bookingId, status, assetId }: { bookingId: string; status: string; assetId?: string }) {
  const router = useRouter();

  async function cancelBooking() {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (data.success) {
        toast("Booking cancelled", { variant: "success" });
        router.refresh();
      } else {
        toast(data.error || "Cancellation failed", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    }
  }

  return (
    <div className="flex gap-2">
      {status === "PENDING" && (
        <Button variant="outline" size="sm" onClick={cancelBooking}>Cancel</Button>
      )}
      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/client/bookings/${bookingId}`)}>View</Button>
      {assetId && status !== "CANCELLED" && status !== "REJECTED" && (
        <Button variant="outline" size="sm" onClick={() => router.push(`/listings/${assetId}`)}>Re-book</Button>
      )}
    </div>
  );
}
