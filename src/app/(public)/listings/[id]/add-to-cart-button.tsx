"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";
import { notifyCartUpdated } from "@/lib/cart-events";

interface AssetProp {
  id: string;
  type: string;
  title: string;
  pricePerDay: number | null;
  pricePerTon: number | null;
  pricePerHour: number | null;
}

export function AddToCartButton({ asset }: { asset: AssetProp; session: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  const isTimeBased = asset.type === "TRUCK" || asset.type === "EQUIPMENT";
  const isMaterial = asset.type === "MATERIAL";

  async function handleAddToCart() {
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = { assetId: asset.id, itemType: isMaterial ? "MATERIAL" : "TRUCK" };
      if (isTimeBased) {
        if (!startDate || !endDate) {
          setError("Please select start and end dates");
          setLoading(false);
          return;
        }
        body.startDate = startDate;
        body.endDate = endDate;
      }
      if (isMaterial) {
        body.quantity = quantity;
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add to cart");
        toast(data.error || "Failed to add to cart", { variant: "error" });
      } else {
        setOpen(false);
        router.refresh();
        notifyCartUpdated();
        toast("Added to cart!", { variant: "success", description: `${asset.title} has been added to your cart.` });
      }
    } catch {
      setError("An error occurred");
      toast("An error occurred", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary w-full">
        Add to Cart
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="font-heading text-lg font-bold text-neutral-900">Add to Cart</h3>
            <p className="mt-1 text-sm text-neutral-500">{asset.title}</p>

            {isTimeBased && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            {isMaterial && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-neutral-700">Quantity (tons)</label>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                Cancel
              </button>
              <button onClick={handleAddToCart} disabled={loading} className="btn-primary flex-1">
                {loading ? <><Spinner size="sm" className="mr-2" /> Adding...</> : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
