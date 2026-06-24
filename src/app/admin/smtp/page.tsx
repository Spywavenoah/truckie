"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";

export default function SmtpSettingsPage() {
  const [form, setForm] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "",
    secure: false,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetch("/api/smtp")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setForm({
            host: res.data.host || "",
            port: res.data.port || 587,
            username: res.data.username || "",
            password: "",
            fromEmail: res.data.fromEmail || "",
            fromName: res.data.fromName || "",
            secure: res.data.secure || false,
          });
        }
      })
      .finally(() => setInitialLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/smtp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        toast("SMTP settings saved", { variant: "success" });
      } else {
        toast(data.error || "Failed to save", { variant: "error" });
      }
    } catch {
      toast("An error occurred while saving", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return <div className="text-neutral-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">SMTP Configuration</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Configure the email server used to send transactional emails (verification, notifications, etc.).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Server Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">SMTP Host</label>
                <input
                  type="text"
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  required
                  placeholder="smtp.example.com"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Port</label>
                <input
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder={form.host ? "Leave blank to keep current" : ""}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">From Email</label>
                <input
                  type="email"
                  value={form.fromEmail}
                  onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                  required
                  placeholder="noreply@example.com"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">From Name</label>
                <input
                  type="text"
                  value={form.fromName}
                  onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                  placeholder="TruckLease Pro"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={form.secure}
                onChange={(e) => setForm({ ...form, secure: e.target.checked })}
                className="rounded border-neutral-300"
              />
              Use SSL/TLS (secure connection)
            </label>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><Spinner size="sm" className="mr-2" /> Saving...</> : "Save Settings"}
              </button>
              {saved && <span className="text-sm text-green-600">Settings saved successfully</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
