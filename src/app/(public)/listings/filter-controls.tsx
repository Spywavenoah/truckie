"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FilterControls({ states }: { states: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  function apply(value: string, key: string) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== "All") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/listings?${params.toString()}`);
  }

  function applyPrice() {
    const min = (document.getElementById("minPrice") as HTMLInputElement)?.value;
    const max = (document.getElementById("maxPrice") as HTMLInputElement)?.value;
    const params = new URLSearchParams(sp.toString());
    if (min) params.set("minPrice", min); else params.delete("minPrice");
    if (max) params.set("maxPrice", max); else params.delete("maxPrice");
    router.push(`/listings?${params.toString()}`);
  }

  const currentType = sp.get("type") || "";
  const currentState = sp.get("state") || "All";
  const currentSort = sp.get("sort") || "newest";

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="font-heading text-lg font-bold text-neutral-900">Filters</h2>

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-neutral-700">Type</label>
          {["All", "Truck", "Equipment", "Material"].map((t) => {
            const val = t === "All" ? "" : t;
            return (
              <label key={t} className="flex items-center gap-2 text-sm text-neutral-600">
                <input type="radio" name="type" value={val} checked={currentType === val}
                  onChange={() => apply(val, "type")}
                  className="rounded-full border-neutral-300 text-accent focus:ring-accent-light" />
                {t}
              </label>
            );
          })}
        </div>

        <div className="mt-6 space-y-2">
          <label className="block text-sm font-medium text-neutral-700">State</label>
          <select value={currentState} onChange={(e) => apply(e.target.value === "All" ? "" : e.target.value, "state")}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700">
            <option value="All">All States</option>
            {states.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>

        <div className="mt-6 space-y-2">
          <label className="block text-sm font-medium text-neutral-700">Price Range</label>
          <div className="flex gap-2">
            <input id="minPrice" type="number" defaultValue={sp.get("minPrice") || ""} placeholder="Min"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <input id="maxPrice" type="number" defaultValue={sp.get("maxPrice") || ""} placeholder="Max"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <button onClick={applyPrice} className="btn-primary mt-6 w-full">Apply Filters</button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500"></p>
        <select value={currentSort} onChange={(e) => apply(e.target.value, "sort")}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700">
          <option value="newest">Sort: Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
    </aside>
  );
}
