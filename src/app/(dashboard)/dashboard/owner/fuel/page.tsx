"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Download, Printer, Search, Fuel } from "lucide-react";

interface FuelLog {
  id: string;
  date: string;
  litersIssued: number | null;
  costPerLiter: number | null;
  totalCost: number | null;
  odometerReading: number | null;
  fuelStation: string | null;
  notes: string | null;
  createdAt: string;
  asset: { id: string; title: string; type: string };
}

function toCSV(logs: FuelLog[]) {
  const header = "Date,Asset,Liters,Cost/L,Total (NGN),Odometer (km),Station,Notes";
  const rows = logs.map((l) =>
    [
      l.date ? new Date(l.date).toLocaleDateString("en-NG") : "",
      l.asset.title,
      l.litersIssued != null ? l.litersIssued.toFixed(1) : "",
      l.costPerLiter != null ? l.costPerLiter.toFixed(2) : "",
      l.totalCost != null ? l.totalCost.toString() : "",
      l.odometerReading != null ? l.odometerReading.toString() : "",
      `"${(l.fuelStation || "").replace(/"/g, '""')}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export default function FuelPage() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/owner/fuel?${params}`);
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch {
      console.error("Failed to load fuel logs");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handlePrint() {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const rows = logs.map(
      (l) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #ccc">${l.date ? new Date(l.date).toLocaleDateString("en-NG") : ""}</td>
        <td style="padding:6px 8px;border:1px solid #ccc">${l.asset.title}</td>
        <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">${l.litersIssued != null ? `${l.litersIssued.toFixed(1)} L` : ""}</td>
        <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">${l.costPerLiter != null ? `₦${l.costPerLiter.toFixed(2)}` : ""}</td>
        <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">${l.totalCost != null ? `₦${l.totalCost.toLocaleString()}` : ""}</td>
        <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">${l.odometerReading != null ? `${l.odometerReading.toLocaleString()} km` : ""}</td>
        <td style="padding:6px 8px;border:1px solid #ccc">${l.fuelStation || ""}</td>
      </tr>`
    ).join("");
    printWin.document.write(`
      <html><head><title>Fuel Records</title>
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
        <p>Fuel Records Report &mdash; Generated ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      <p class="summary">Total Entries: ${logs.length} | Total Liters: ${logs.reduce((s, l) => s + (l.litersIssued || 0), 0).toFixed(1)} L | Total Cost: ₦${logs.reduce((s, l) => s + (l.totalCost || 0), 0).toLocaleString()}</p>
      <table>
        <thead><tr>
          <th>Date</th><th>Asset</th><th style="text-align:right">Liters</th><th style="text-align:right">Cost/L</th><th style="text-align:right">Total</th><th style="text-align:right">Odometer</th><th>Station</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>
    `);
    printWin.document.close();
    printWin.print();
  }

  const totalLiters = logs.reduce((s, l) => s + (l.litersIssued || 0), 0);
  const totalCost = logs.reduce((s, l) => s + (l.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <Fuel className="h-6 w-6" /> Fuel Records
          </h1>
          <p className="mt-1 text-sm text-neutral-500">View all fuel logs across your fleet.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const csv = toCSV(logs);
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "fuel-records.csv";
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
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by asset, station, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-8 text-sm sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No fuel records found.</p>
          ) : (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-neutral-500">Total Entries</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900">{logs.length}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-neutral-500">Total Liters</p>
                  <p className="font-heading text-2xl font-bold text-neutral-900">{totalLiters.toFixed(1)} L</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-neutral-500">Total Cost</p>
                  <p className="font-heading text-2xl font-bold text-success">{formatCurrency(totalCost)}</p>
                </CardContent></Card>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                      <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Asset</th>
                      <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900 text-right">Liters</th>
                      <th className="hidden sm:table-cell pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900 text-right">Cost/L</th>
                      <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900 text-right">Total</th>
                      <th className="hidden md:table-cell pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900 text-right">Odometer</th>
                      <th className="hidden md:table-cell pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Station</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {logs.map((l) => (
                      <tr key={l.id} className="hover:bg-neutral-50">
                        <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">
                          {l.date ? new Date(l.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "—"}
                        </td>
                        <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-neutral-900">{l.asset.title}</td>
                        <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-right text-neutral-900">
                          {l.litersIssued != null ? `${l.litersIssued.toFixed(1)} L` : "—"}
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2 md:px-4 md:py-3 font-mono text-right text-neutral-600">
                          {l.costPerLiter != null ? `₦${l.costPerLiter.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-right text-success">
                          {l.totalCost != null ? formatCurrency(l.totalCost) : "—"}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 font-mono text-right text-neutral-600">
                          {l.odometerReading != null ? `${l.odometerReading.toLocaleString()} km` : "—"}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-neutral-600">{l.fuelStation || "—"}</td>
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
