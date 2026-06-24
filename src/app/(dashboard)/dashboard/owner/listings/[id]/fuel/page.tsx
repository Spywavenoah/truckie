"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface FuelLog {
  id: string;
  date: string;
  litersIssued: number | null;
  costPerLiter: number | null;
  totalCost: number | null;
  odometerReading: number | null;
  fuelStation: string | null;
  notes: string | null;
}

export default function FuelLogPage() {
  const params = useParams();
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [assetTitle, setAssetTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    litersIssued: "",
    costPerLiter: "",
    totalCost: "",
    odometerReading: "",
    fuelStation: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const totalLiters = logs.reduce((sum, l) => sum + (l.litersIssued || 0), 0);
  const totalCostAll = logs.reduce((sum, l) => sum + (l.totalCost || 0), 0);

  const fetchData = async () => {
    try {
      const [assetRes, fuelRes] = await Promise.all([
        fetch(`/api/assets/${params.id}`),
        fetch(`/api/assets/${params.id}/fuel`),
      ]);
      const assetJson = await assetRes.json();
      if (assetJson.success) setAssetTitle(assetJson.data.title);
      const fuelJson = await fuelRes.json();
      if (fuelJson.success) setLogs(fuelJson.data);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      if (form.litersIssued) payload.litersIssued = parseFloat(form.litersIssued);
      if (form.costPerLiter) payload.costPerLiter = parseFloat(form.costPerLiter);
      if (form.totalCost) payload.totalCost = parseFloat(form.totalCost);
      if (form.odometerReading) payload.odometerReading = parseFloat(form.odometerReading);
      if (form.fuelStation) payload.fuelStation = form.fuelStation;
      if (form.notes) payload.notes = form.notes;

      const res = await fetch(`/api/assets/${params.id}/fuel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setLogs((prev) => [json.data, ...prev]);
        setShowForm(false);
        setForm({
          litersIssued: "", costPerLiter: "", totalCost: "",
          odometerReading: "", fuelStation: "", notes: "",
        });
      }
    } catch (err) {
      console.error("Failed to create fuel log", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-neutral-400">Loading fuel logs...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Fuel Logs</h1>
          <p className="mt-1 text-sm text-neutral-500">{assetTitle || "Asset"}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Entry"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-neutral-500">Total Liters</p>
            <p className="font-heading text-2xl font-bold text-neutral-900">
              {totalLiters.toFixed(1)} L
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-neutral-500">Total Cost</p>
            <p className="font-heading text-2xl font-bold text-success">
              ₦{totalCostAll.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-neutral-500">Entries</p>
            <p className="font-heading text-2xl font-bold text-neutral-900">{logs.length}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Fuel Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="liters">Liters Issued</Label>
                  <Input
                    id="liters"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 50"
                    value={form.litersIssued}
                    onChange={(e) => setForm({ ...form, litersIssued: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPerLiter">Cost per Liter (₦)</Label>
                  <Input
                    id="costPerLiter"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 650"
                    value={form.costPerLiter}
                    onChange={(e) => setForm({ ...form, costPerLiter: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalCost">Total Cost (₦)</Label>
                  <Input
                    id="totalCost"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 32500"
                    value={form.totalCost}
                    onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odometer">Odometer Reading</Label>
                  <Input
                    id="odometer"
                    type="number"
                    placeholder="km"
                    value={form.odometerReading}
                    onChange={(e) => setForm({ ...form, odometerReading: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="station">Fuel Station</Label>
                  <Input
                    id="station"
                    placeholder="Station name"
                    value={form.fuelStation}
                    onChange={(e) => setForm({ ...form, fuelStation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Spinner size="sm" className="mr-2" /> Saving...</> : "Save Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-8 text-center text-sm text-neutral-400">No fuel records yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Fuel Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Liters</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Cost/L</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Total</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Odometer</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Station</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">
                        {new Date(log.date).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short",
                        })}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-neutral-900">
                        {log.litersIssued?.toFixed(1)} L
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-neutral-600">
                        {log.costPerLiter ? `₦${log.costPerLiter.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-success">
                        {log.totalCost ? `₦${log.totalCost.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">
                        {log.odometerReading ? `${log.odometerReading.toLocaleString()} km` : "-"}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{log.fuelStation || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
