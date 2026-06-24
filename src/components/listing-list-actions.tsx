"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function ListingListActions({ assetId, availabilityStatus }: { assetId: string; availabilityStatus: string }) {
  const router = useRouter();

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
        toast(`Listing ${newStatus.toLowerCase()}`, { variant: "success" });
        router.refresh();
      } else {
        toast(data.error || "Action failed", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/owner/listings/${assetId}/edit`}>Edit</Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={toggleAvailability}>
        {availabilityStatus === "AVAILABLE" ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
