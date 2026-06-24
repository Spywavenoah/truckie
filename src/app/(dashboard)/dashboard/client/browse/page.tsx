"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, X } from "lucide-react";
import { notifyCartUpdated } from "@/lib/cart-events";

interface Listing {
  id: string;
  title: string;
  type: string;
  pricePerDay: number | null;
  pricePerHour: number | null;
  pricePerTon: number | null;
  state: string | null;
  location: string | null;
  owner: { fullName: string };
}

const typeLabel: Record<string, string> = {
  TRUCK: "Truck",
  EQUIPMENT: "Equipment",
  MATERIAL: "Material",
};

function getPrice(a: Listing): string {
  if (a.pricePerDay) return `${formatCurrency(a.pricePerDay)}/day`;
  if (a.pricePerHour) return `${formatCurrency(a.pricePerHour)}/hr`;
  if (a.pricePerTon) return `${formatCurrency(a.pricePerTon)}/ton`;
  return "Contact for price";
}

function getInitials(title: string): string {
  return title.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ClientBrowsePage() {
  const [assets, setAssets] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [modal, setModal] = useState<{ asset: Listing } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  function loadAssets() {
    setLoading(true);
    const params = new URLSearchParams({ approved: "true" });
    if (typeFilter && typeFilter !== "All") params.set("type", typeFilter.toUpperCase());
    if (search) params.set("search", search);
    fetch(`/api/assets?${params}`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setAssets(json.data); })
      .catch(() => setMsg("Failed to load listings"))
      .finally(() => setLoading(false));
  }

  useEffect(loadAssets, [typeFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadAssets();
  }

  async function addToCart() {
    if (!modal) return;
    setAdding(true);
    setMsg("");

    const body: Record<string, unknown> = {
      assetId: modal.asset.id,
      itemType: modal.asset.type === "MATERIAL" ? "MATERIAL" : "TRUCK",
    };

    if (modal.asset.type === "MATERIAL") {
      body.quantity = parseFloat(quantity) || 1;
    } else {
      if (!startDate || !endDate) {
        setMsg("Please select start and end dates");
        setAdding(false);
        return;
      }
      body.startDate = new Date(startDate).toISOString();
      body.endDate = new Date(endDate).toISOString();
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("Added to cart!");
        notifyCartUpdated();
        setModal(null);
        setStartDate("");
        setEndDate("");
        setQuantity("1");
      } else {
        setMsg(json.error || "Failed to add");
      }
    } catch {
      setMsg("An error occurred");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <p className="py-8 text-center text-neutral-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Browse Listings</h1>
        <p className="mt-1 text-sm text-neutral-500">Find trucks, equipment, and materials for hire.</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row">
        <Input placeholder="Search listings..." className="sm:max-w-md" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {["All", "Truck", "Equipment", "Material"].map((t) => (<option key={t}>{t}</option>))}
        </select>
        <Button variant="outline" type="submit">Search</Button>
      </form>

      {msg && (
        <div className={`rounded-md p-3 text-sm ${msg === "Added to cart!" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg}
        </div>
      )}

      {assets.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">No listings available.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="flex h-40 items-center justify-center bg-neutral-100">
                <span className="font-heading text-2xl font-bold text-neutral-300">{getInitials(asset.title)}</span>
              </div>
              <CardContent className="p-4">
                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {typeLabel[asset.type] || asset.type}
                </span>
                <a href={`/listings/${asset.id}`} className="mt-2 font-heading text-base font-bold text-neutral-900 hover:text-accent">{asset.title}</a>
                <p className="mt-1 font-mono text-lg font-bold text-success">{getPrice(asset)}</p>
                <p className="mt-1 text-sm text-neutral-500">{asset.state || asset.location || "N/A"}</p>
                <Button className="mt-4 w-full" onClick={() => setModal({ asset })}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">{modal.asset.title}</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modal.asset.type === "MATERIAL" ? (
              <div className="mt-4">
                <label htmlFor="browse-qty" className="block text-sm font-medium text-neutral-700">
                  Quantity ({modal.asset.pricePerTon ? formatCurrency(modal.asset.pricePerTon) + "/ton" : "tons"})
                </label>
                <input
                  id="browse-qty"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="browse-start" className="block text-sm font-medium text-neutral-700">Start Date</label>
                  <input
                    id="browse-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="browse-end" className="block text-sm font-medium text-neutral-700">End Date</label>
                  <input
                    id="browse-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <Button className="mt-6 w-full" onClick={addToCart} disabled={adding}>
              {adding ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
