"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface MaintenanceLog {
  id: string;
  maintenanceType: string;
  description: string | null;
  cost: number | null;
  currency: string;
  vendorName: string | null;
  odometerReading: number | null;
  nextDueDate: string | null;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  ROUTINE: "Routine",
  REPAIR: "Repair",
  INSPECTION: "Inspection",
  TIRE: "Tire",
  ENGINE: "Engine",
  OTHER: "Other",
};

const typeVariants: Record<string, string> = {
  ROUTINE: "default",
  REPAIR: "destructive",
  INSPECTION: "warning",
  TIRE: "secondary",
  ENGINE: "destructive",
  OTHER: "outline",
};

export default function MaintenancePage() {
  const params = useParams();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [assetTitle, setAssetTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    maintenanceType: "ROUTINE",
    description: "",
    cost: "",
    vendorName: "",
    odometerReading: "",
    nextDueDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [assetRes, logsRes] = await Promise.all([
        fetch(`/api/assets/${params.id}`),
        fetch(`/api/assets/${params.id}/maintenance`),
      ]);
      const assetJson = await assetRes.json();
      if (assetJson.success) setAssetTitle(assetJson.data.title);
      const logsJson = await logsRes.json();
      if (logsJson.success) setLogs(logsJson.data);
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
      const res = await fetch(`/api/assets/${params.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cost: form.cost ? parseFloat(form.cost) : null,
          odometerReading: form.odometerReading ? parseFloat(form.odometerReading) : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLogs((prev) => [json.data, ...prev]);
        setShowForm(false);
        setForm({
          maintenanceType: "ROUTINE",
          description: "",
          cost: "",
          vendorName: "",
          odometerReading: "",
          nextDueDate: "",
        });
      }
    } catch (err) {
      console.error("Failed to create log", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-neutral-400">Loading maintenance logs...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Maintenance Logs</h1>
          <p className="mt-1 text-sm text-neutral-500">{assetTitle || "Asset"}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Record"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Maintenance Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    value={form.maintenanceType}
                    onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })}
                  >
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (₦)</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="0.00"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor Name</Label>
                  <Input
                    id="vendor"
                    placeholder="Vendor name"
                    value={form.vendorName}
                    onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
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
                  <Label htmlFor="dueDate">Next Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.nextDueDate}
                    onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="desc">Description</Label>
                  <textarea
                    id="desc"
                    className="flex min-h-[80px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    placeholder="Describe the maintenance performed"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Spinner size="sm" className="mr-2" /> Saving...</> : "Save Record"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-8 text-center text-sm text-neutral-400">No maintenance records yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-8 before:absolute before:left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-neutral-200">
          {logs.map((log) => (
            <div key={log.id} className="relative pb-8">
              <div className="absolute -left-[1.625rem] mt-1.5 h-3 w-3 rounded-full border-2 border-accent bg-white" />
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Badge variant={typeVariants[log.maintenanceType] as any}>
                        {typeLabels[log.maintenanceType] || log.maintenanceType}
                      </Badge>
                      {log.description && (
                        <p className="text-sm text-neutral-700">{log.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-500">
                        {log.cost !== null && (
                          <span>Cost: ₦{log.cost.toLocaleString()}</span>
                        )}
                        {log.vendorName && (
                          <span>Vendor: {log.vendorName}</span>
                        )}
                        {log.odometerReading !== null && (
                          <span>Odometer: {log.odometerReading.toLocaleString()} km</span>
                        )}
                        {log.nextDueDate && (
                          <span>Next Due: {new Date(log.nextDueDate).toLocaleDateString("en-NG")}</span>
                        )}
                        <span>
                          {new Date(log.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
