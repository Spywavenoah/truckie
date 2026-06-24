"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function ListingActions({ assetId, isApproved, availabilityStatus }: { assetId: string; isApproved: boolean; availabilityStatus: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleAvailability() {
    try {
      const newStatus = availabilityStatus === "AVAILABLE" ? "INACTIVE" : "AVAILABLE";
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Listing now ${newStatus.toLowerCase()}`, { variant: "success" });
        router.refresh();
      } else {
        toast(data.error || "Action failed", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    }
  }

  async function deleteListing() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast("Listing deactivated", { variant: "success" });
        router.push("/dashboard/owner/listings");
      } else {
        toast(data.error || "Failed to deactivate", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <a href={`/dashboard/owner/listings/${assetId}/edit`}>Edit</a>
        </Button>
        <Button variant="outline" onClick={toggleAvailability}>
          {availabilityStatus === "AVAILABLE" ? "Mark Inactive" : "Mark Available"}
        </Button>
        <Button variant="destructive" onClick={() => setShowConfirm(true)} disabled={deleting}>
          {deleting ? "Deactivating..." : "Deactivate"}
        </Button>
      </div>
      <ConfirmDialog
        open={showConfirm}
        title="Deactivate Listing"
        message="Are you sure you want to deactivate this listing? This can be reversed later."
        confirmLabel="Deactivate"
        onConfirm={deleteListing}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
