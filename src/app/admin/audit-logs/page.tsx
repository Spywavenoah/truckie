"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/pagination";
import { formatDateTime } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditLog {
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  detail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: { id: string; fullName: string; email: string };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  function load(p: number) {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", "20");
    fetch(`/api/admin/audit-logs?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setLogs(res.data);
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
        }
      })
      .catch((e) => console.error("admin audit-logs: fetch failed", e))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-neutral-500">Full audit trail of all administrative actions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">Loading audit logs...</p>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No audit logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Admin</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Action</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Resource</th>
                    <th className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Detail</th>
                    <th className="px-3 py-2 md:px-4 md:py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-sm text-neutral-700">{log.admin.email}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-900">{log.action}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-600">{log.resource || "—"}</td>
                      <td className="hidden md:table-cell px-3 py-2 md:px-4 md:py-3 text-sm text-neutral-500 max-w-[200px] truncate">{log.detail || "—"}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-right font-mono text-sm text-neutral-500">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {logs.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => load(p)} />
          )}
        </CardContent>
      </Card>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedLog(null)}>
          <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
              <h2 className="text-base font-bold text-neutral-900">Audit Log Detail</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 px-5 py-4 text-sm">
              <div className="flex justify-between border-b border-neutral-100 py-2">
                <span className="text-neutral-500">ID</span>
                <span className="font-mono font-medium text-neutral-900">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2">
                <span className="text-neutral-500">Admin</span>
                <span className="font-medium text-neutral-900">{selectedLog.admin.fullName} ({selectedLog.admin.email})</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2">
                <span className="text-neutral-500">Action</span>
                <span className="font-medium text-neutral-900">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2">
                <span className="text-neutral-500">Resource</span>
                <span className="font-medium text-neutral-900">{selectedLog.resource || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2">
                <span className="text-neutral-500">Resource ID</span>
                <span className="font-mono font-medium text-neutral-900">{selectedLog.resourceId || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2">
                <span className="text-neutral-500">Detail</span>
                <span className="max-w-[260px] text-right font-medium text-neutral-900">{selectedLog.detail || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2">
                <span className="text-neutral-500">IP Address</span>
                <span className="font-mono font-medium text-neutral-900">{selectedLog.ipAddress || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2">
                <span className="text-neutral-500">User Agent</span>
                <span className="max-w-[260px] truncate text-right font-medium text-neutral-900" title={selectedLog.userAgent || ""}>{selectedLog.userAgent || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-2">
                <span className="text-neutral-500">Timestamp</span>
                <span className="font-medium text-neutral-900">{formatDateTime(selectedLog.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
