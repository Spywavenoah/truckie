"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";

type Tab = "categories" | "states";

interface Category {
  id: string; name: string; slug: string; icon: string | null; sortOrder: number; isActive: boolean;
}

interface LGA {
  id: string; name: string; slug: string; stateId: string; sortOrder: number; isActive: boolean;
  state?: { name: string };
}

interface StateItem {
  id: string; name: string; slug: string; sortOrder: number; isActive: boolean;
  lgas: LGA[];
}

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState<Partial<Category> | null>(null);
  const [editState, setEditState] = useState<Partial<StateItem> | null>(null);
  const [editLga, setEditLga] = useState<{ stateId: string; name: string; slug: string } | null>(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [showNewState, setShowNewState] = useState(false);
  const [showNewLga, setShowNewLga] = useState<string | null>(null);
  const [catFormName, setCatFormName] = useState("");
  const [catFormSlug, setCatFormSlug] = useState("");
  const [catFormOrder, setCatFormOrder] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/admin/content/categories").then(r => r.json()),
        fetch("/api/admin/content/states").then(r => r.json()),
      ]);
      if (cRes.success) setCategories(cRes.data);
      if (sRes.success) setStates(sRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveCategory(data: Partial<Category>) {
    const url = data.id ? `/api/admin/content/categories/${data.id}` : "/api/admin/content/categories";
    const method = data.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    if (json.success) { toast("Category saved", { variant: "success" }); load(); setShowNewCat(false); setEditCat(null); }
    else toast(json.error, { variant: "error" });
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/content/categories/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { toast("Category deleted", { variant: "success" }); load(); }
    else toast(json.error, { variant: "error" });
  }

  async function saveState(data: Partial<StateItem>) {
    const url = data.id ? `/api/admin/content/states/${data.id}` : "/api/admin/content/states";
    const method = data.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    if (json.success) { toast("State saved", { variant: "success" }); load(); setShowNewState(false); setEditState(null); }
    else toast(json.error, { variant: "error" });
  }

  async function deleteState(id: string) {
    if (!confirm("Delete this state and its LGAs?")) return;
    const res = await fetch(`/api/admin/content/states/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { toast("State deleted", { variant: "success" }); load(); }
    else toast(json.error, { variant: "error" });
  }

  async function saveLga(data: { stateId: string; name: string; slug: string }) {
    const res = await fetch("/api/admin/content/lgas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    if (json.success) { toast("LGA added", { variant: "success" }); load(); setShowNewLga(null); }
    else toast(json.error, { variant: "error" });
  }

  async function deleteLga(id: string) {
    if (!confirm("Delete this LGA?")) return;
    const res = await fetch(`/api/admin/content/lgas/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { toast("LGA deleted", { variant: "success" }); load(); }
    else toast(json.error, { variant: "error" });
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">Content Management</h1>
        <div className="flex gap-2">
          <Button variant={tab === "categories" ? "default" : "outline"} size="sm" onClick={() => setTab("categories")}>Categories</Button>
          <Button variant={tab === "states" ? "default" : "outline"} size="sm" onClick={() => setTab("states")}>States & LGAs</Button>
        </div>
      </div>

      {tab === "categories" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Asset Categories</CardTitle>
            <Button size="sm" onClick={() => setShowNewCat(true)}>Add Category</Button>
          </CardHeader>
          <CardContent>
            {showNewCat && (
              <div className="mb-4 p-3 bg-neutral-50 rounded-md">
                <div className="flex gap-2 items-end">
                  <input className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm" placeholder="Name" value={catFormName} onChange={e => setCatFormName(e.target.value)} />
                  <input className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm" placeholder="slug" value={catFormSlug} onChange={e => setCatFormSlug(e.target.value)} />
                  <input className="input-field text-sm w-16" type="number" placeholder="Order" value={catFormOrder} onChange={e => setCatFormOrder(Number(e.target.value))} />
                  <Button size="sm" onClick={() => saveCategory({ name: catFormName, slug: catFormSlug, sortOrder: catFormOrder })}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowNewCat(false); setCatFormName(""); setCatFormSlug(""); setCatFormOrder(0); }}>Cancel</Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <span className="ml-2 text-neutral-400">/{c.slug}</span>
                    {c.sortOrder > 0 && <span className="ml-2 text-neutral-400">order: {c.sortOrder}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditCat(c)}>Edit</Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => deleteCategory(c.id)}>Delete</Button>
                  </div>
                  {editCat?.id === c.id && (
                    <div className="w-full mt-2">
                      <div className="flex gap-2 items-end">
                        <input className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm" placeholder="Name" value={editCat.name || ""} onChange={e => setEditCat({ ...editCat, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
                        <input className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm" placeholder="slug" value={editCat.slug || ""} onChange={e => setEditCat({ ...editCat, slug: e.target.value })} />
                        <input className="input-field text-sm w-16" type="number" placeholder="Order" value={editCat.sortOrder ?? 0} onChange={e => setEditCat({ ...editCat, sortOrder: Number(e.target.value) })} />
                        <Button size="sm" onClick={() => saveCategory(editCat)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditCat(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-neutral-400">No categories yet.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "states" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">States & LGAs</CardTitle>
            <Button size="sm" onClick={() => setShowNewState(true)}>Add State</Button>
          </CardHeader>
          <CardContent>
            {showNewState && (
              <div className="mb-4 p-3 bg-neutral-50 rounded-md flex gap-2 items-end">
                <input className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm" placeholder="State name" onChange={e => {
                  const s = e.target.value;
                  setEditState({ name: s, slug: s.toLowerCase().replace(/\s+/g, "-") });
                }} />
                <input className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm" placeholder="sort order" type="number" onChange={e => setEditState(prev => ({ ...prev, sortOrder: Number(e.target.value) }))} />
                <Button size="sm" onClick={() => saveState(editState || {})}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setShowNewState(false)}>Cancel</Button>
              </div>
            )}
            <div className="space-y-3">
              {states.map(s => (
                <div key={s.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.name} <span className="text-neutral-400 text-xs">({s.lgas.length} LGAs)</span></span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowNewLga(s.id)}>+ LGA</Button>
                      <Button size="sm" variant="outline" className="text-red-500" onClick={() => deleteState(s.id)}>Delete</Button>
                    </div>
                  </div>
                  {showNewLga === s.id && (
                    <div className="mt-2 flex gap-2 items-end">
                      <input className="input-field text-sm flex-1" placeholder="LGA name" onChange={e => setEditLga({ stateId: s.id, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
                      <Button size="sm" onClick={() => editLga && saveLga(editLga)}>Add</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowNewLga(null)}>Cancel</Button>
                    </div>
                  )}
                  {s.lgas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.lgas.map(l => (
                        <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                          {l.name}
                          <button onClick={() => deleteLga(l.id)} className="text-red-400 hover:text-red-600">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {states.length === 0 && <p className="text-sm text-neutral-400">No states yet.</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
