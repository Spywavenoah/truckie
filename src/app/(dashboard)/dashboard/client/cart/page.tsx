"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingCart, Trash2, Truck, Package } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { notifyCartUpdated } from "@/lib/cart-events";
import { Spinner } from "@/components/ui/spinner";

interface CartItem {
  id: string;
  itemType: "TRUCK" | "MATERIAL";
  startDate: string | null;
  endDate: string | null;
  quantity: number | null;
  totalCost: number;
  asset: {
    id: string;
    title: string;
    type: string;
    pricePerDay: number | null;
    pricePerTon: number | null;
    unit: string | null;
  };
}

interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCart() {
    try {
      const res = await fetch("/api/cart");
      const json = await res.json();
      if (json.success) setCart(json.data);
    } catch {
      setMessage("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCart(); }, []);

  async function removeItem(itemId: string) {
    const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast("Item removed", { variant: "info" });
      notifyCartUpdated();
      loadCart();
    }
  }

  async function checkout() {
    setCheckingOut(true);
    setMessage("");
    try {
      const res = await fetch("/api/cart/checkout", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast("Checkout successful!", { variant: "success", description: json.message });
        notifyCartUpdated();
        setCart({ ...cart!, items: [], total: 0 });
        setTimeout(() => router.push("/dashboard/client/bookings"), 1500);
      } else {
        toast("Checkout failed", { variant: "error", description: json.error });
        setMessage(json.error || "Checkout failed");
      }
    } catch {
      setMessage("An error occurred");
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) return <div className="p-6 text-neutral-400">Loading cart...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Shopping Cart</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {cart?.items.length || 0} item(s) in your cart
          </p>
        </div>
        {cart && cart.items.length > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold text-neutral-900">{formatCurrency(cart.total)}</p>
            <p className="text-xs text-neutral-400">Total</p>
          </div>
        )}
      </div>

      {message && (
        <div className={`rounded-md p-3 text-sm ${message.includes("successful") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {message}
        </div>
      )}

      {!cart || cart.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="mb-4 h-12 w-12 text-neutral-300" />
            <p className="text-neutral-400">Your cart is empty</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard/client/browse")}>
              Browse Listings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-start justify-between p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {item.itemType === "TRUCK" ? <Truck className="h-5 w-5 text-primary" /> : <Package className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">{item.asset.title}</h3>
                      <p className="text-xs text-neutral-400">{item.itemType === "TRUCK" ? "Truck Rental" : "Material"}</p>
                      {item.itemType === "TRUCK" && item.startDate && item.endDate && (
                        <p className="mt-1 text-xs text-neutral-500">
                          {formatDate(item.startDate)} — {formatDate(item.endDate)}
                        </p>
                      )}
                      {item.itemType === "MATERIAL" && item.quantity && (
                        <p className="mt-1 text-xs text-neutral-500">Quantity: {item.quantity} {item.asset.unit || "tons"}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-neutral-900">{formatCurrency(item.totalCost)}</span>
                    <button onClick={() => removeItem(item.id)} className="rounded-md p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-neutral-900">Total</span>
                <span className="font-mono text-xl font-bold text-primary">{formatCurrency(cart.total)}</span>
              </div>
              <Button className="mt-4 w-full" onClick={checkout} disabled={checkingOut}>
                {checkingOut ? <><Spinner size="sm" className="mr-2" /> Processing...</> : `Pay ${formatCurrency(cart.total)}`}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
