"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, Printer, Search, Wrench } from "lucide-react";

interface MaintenanceLog {
  id: string;
  maintenanceType: string;
  description: string | null;
  cost: number | null;
  vendorName: string | null;
  odometerReading: number | null;
  nextDueDate: string | null;
  createdAt: string;
  asset: { id: string; title: string; type: string };
}

const typeLabels: Record<string, string> = {
  ROUTINE: "Routine",
  REPAIR: "Repair",
  INSPECTION: "Inspection",
  TIRE: "Tire",
  ENGINE: "Engine",
  OTHER: "Other",
};

const typeVariants: Record<string, "default" | "destructive" | "warning" | "secondary"> = {
  ROUTINE: "default",
  REPAIR: "destructive",
  INSPECTION: "warning",
  TIRE: "secondary",
  ENGINE: "destructive",
  OTHER: "secondary",
};

function toCSV(logs: MaintenanceLog[]) {
  const header = "Date,Asset,Type,Description,Cost (NGN),Vendor,Odometer (km),Next Due";
  const rows = logs.map((l) =>
    [
      formatDate(l.createdAt),
      l.asset.title,
      typeLabels[l.maintenanceType] || l.maintenanceType,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      l.cost != null ? l.cost.toString() : "",
      `"${(l.vendorName || "").replace(/"/g, '""')}"`,
      l.odometerReading != null ? l.odometerReading.toString() : "",
      l.nextDueDate ? formatDate(l.nextDueDate) : "",
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/owner/maintenance?${params}`);
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch {
      console.error("Failed to load maintenance logs");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handlePrint() {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const rows = logs.map(
      (l) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #ccc">${formatDate(l.createdAt)}</td>
        <td style="padding:6px 8px;border:1px solid #ccc">${l.asset.title}</td>
        <td style="padding:6px 8px;border:1px solid #ccc">${typeLabels[l.maintenanceType] || l.maintenanceType}</td>
        <td style="padding:6px 8px;border:1px solid #ccc">${l.description || ""}</td>
        <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">${l.cost != null ? `₦${l.cost.toLocaleString()}` : ""}</td>
        <td style="padding:6px 8px;border:1px solid #ccc">${l.vendorName || ""}</td>
        <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">${l.odometerReading != null ? `${l.odometerReading.toLocaleString()} km` : ""}</td>
      </tr>`
    ).join("");
    printWin.document.write(`
      <html><head><title>Maintenance Records</title>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; color: #1a1a1a; padding: 40px; }
        .letterhead { text-align: center; border-bottom: 2px solid #002366; padding-bottom: 16px; margin-bottom: 24px; }
        .letterhead h1 { color: #002366; margin: 0; font-size: 24px; }
        .letterhead p { color: #666; margin: 4px 0 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f5f5f5; padding: 8px; border: 1px solid #ccc; text-align: left; font-weight: 600; }
        .summary { margin-bottom: 16px; font-size: 13px; color: #666; }
      </style></head><body>
      <div class="letterhead">
        <h1>TruckLeasePro</h1>
        <p>Maintenance Records Report &mdash; Generated ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      <p class="summary">Total Records: ${logs.length} | Total Cost: ₦${logs.reduce((s, l) => s + (l.cost || 0), 0).toLocaleString()}</p>
      <table>
        <thead><tr>
          <th>Date</th><th>Asset</th><th>Type</th><th>Description</th><th style="text-align:right">Cost</th><th>Vendor</th><th style="text-align:right">Odometer</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>
    `);
    printWin.document.close();
    printWin.print();
  }

  const totalCost = logs.reduce((s, l) => s + (l.cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <Wrench className="h-6 w-6" /> Maintenance Records
          </h1>
          <p className="mt-1 text-sm text-neutral-500">View all maintenance records across your fleet.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const csv = toCSV(logs);
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "maintenance-records.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Records</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48 pl-8 text-sm"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700"
              >
                <option value="">All Types</option>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No maintenance records found.</p>
          ) : (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-neutral-500">Total Records</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900">{logs.length}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-neutral-500">Total Cost</p>
                  <p className="font-heading text-2xl font-bold text-success">{formatCurrency(totalCost)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-neutral-500">Avg Cost/Record</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900">
                    {logs.length > 0 ? formatCurrency(Math.round(totalCost / logs.length)) : "—"}
                  </p>
                </CardContent></Card>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                      <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Asset</th>
                      <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Type</th>
                      <th className="hidden sm:table-cell pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Description</th>
                      <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900 text-right">Cost</th>
                      <th className="hidden md:table-cell pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Vendor</th>
                      <th className="hidden md:table-cell pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900 text-right">Odometer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {logs.map((l) => (
                      <tr key={l.id} className="hover:bg-neutral-50">
                        <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{formatDate(l.createdAt)}</td>
                        <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-neutral-900">{l.asset.title}</td>
                        <td className="px-3 py-2 md:px-4 md:py-3">
                          <Badge variant={typeVariants[l.maintenanceType] || "secondary"}>
                            {typeLabels[l.maintenanceType] || l.maintenanceType}
                          </Badge>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 text-neutral-600">{l.description || "—"}</td>
                        <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-right text-success">
                          {l.cost != null ? formatCurrency(l.cost) : "—"}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-neutral-600">{l.vendorName || "—"}</td>
                        <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 font-mono text-right text-neutral-600">
                          {l.odometerReading != null ? `${l.odometerReading.toLocaleString()} km` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
