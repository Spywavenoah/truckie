"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export function SaveButton({ assetId }: { assetId: string }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSaved(res.data.some((i: any) => i.assetId === assetId));
      })
      .catch(() => {});
  }, [assetId]);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const json = await res.json();
      if (json.success) setSaved(json.saved);
    } catch {}
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
        saved ? "border-red-200 bg-red-50 text-red-600" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
      }`}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
