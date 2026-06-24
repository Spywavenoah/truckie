"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";

type Tab = "general" | "monnify" | "smtp" | "fees" | "broadcast";

interface PlatformSettings {
  companyName: string;
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  monnifyApiKey: string;
  monnifySecretKey: string;
  monnifyContractCode: string;
  monnifyBaseUrl: string;
  platformFee: number;
  escrowReleaseDelay: number;
  minDeposit: number;
  reversalFee: number;
}

interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [platform, setPlatform] = useState<PlatformSettings | null>(null);
  const [smtp, setSmtp] = useState<SmtpSettings | null>(null);
  const [smtpPass, setSmtpPass] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastRole, setBroadcastRole] = useState("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/platform-settings").then((r) => r.json()),
      fetch("/api/smtp").then((r) => r.json().catch(() => ({}))),
    ])
      .then(([pRes, sRes]) => {
        if (pRes.success) {
          const masked = pRes.data;
          if (masked.monnifySecretKey === "••••••••") masked.monnifySecretKey = "";
          setPlatform(masked);
        }
        if (sRes.success && sRes.data) setSmtp(sRes.data);
      })
      .catch((e) => console.error("settings load failed", e))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setPlatform((p) => p ? { ...p, [key]: value } : p);
  }

  async function savePlatform() {
    if (!platform) return;
    setSaving(true);
    try {
      const body = { ...platform };
      if (body.monnifySecretKey === "••••••••") delete (body as any).monnifySecretKey;

      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upJson = await upRes.json();
        if (upJson.success) body.logoUrl = upJson.data.url;
      }
      if (faviconFile) {
        const fd = new FormData();
        fd.append("file", faviconFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upJson = await upRes.json();
        if (upJson.success) body.faviconUrl = upJson.data.url;
      }

      const res = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) toast("Platform settings saved", { variant: "success" });
      else toast(json.error || "Failed to save", { variant: "error" });
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setSaving(false);
      setLogoFile(null);
      setFaviconFile(null);
    }
  }

  async function saveSmtp(e: React.FormEvent) {
    e.preventDefault();
    if (!smtp) return;
    setSaving(true);
    try {
      const body = { ...smtp };
      if (smtpPass) (body as any).password = smtpPass;
      const res = await fetch("/api/smtp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast("SMTP settings saved", { variant: "success" });
        setSmtpPass("");
      } else {
        toast(json.error || "Failed to save", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-8 text-center text-sm text-neutral-400">Loading settings...</p>;

  async function sendBroadcast() {
    if (!broadcastTitle || !broadcastMsg) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMsg, role: broadcastRole }),
      });
      const json = await res.json();
      if (json.success) {
        toast(json.message, { variant: "success" });
        setBroadcastTitle("");
        setBroadcastMsg("");
      } else {
        toast(json.error || "Failed to send", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "monnify", label: "Monnify" },
    { key: "smtp", label: "SMTP" },
    { key: "fees", label: "Fees & Config" },
    { key: "broadcast", label: "Broadcast" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">Platform-wide configuration and preferences.</p>
      </div>

      <div className="flex gap-1 border-b border-neutral-200" role="tablist" aria-label="Settings tabs">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-accent text-accent" : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && platform && (
        <Card>
          <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-company-name" className="mb-1 block text-sm font-medium text-neutral-700">Company Name</label>
                <input id="settings-company-name" type="text" value={platform.companyName} onChange={(e) => update("companyName", e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="settings-app-name" className="mb-1 block text-sm font-medium text-neutral-700">App Name</label>
                <input id="settings-app-name" type="text" value={platform.appName} onChange={(e) => update("appName", e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-logo" className="mb-1 block text-sm font-medium text-neutral-700">Logo</label>
                {platform.logoUrl && <img src={platform.logoUrl} alt="Logo" className="mb-2 h-12 object-contain" />}
                <input id="settings-logo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm" />
              </div>
              <div>
                <label htmlFor="settings-favicon" className="mb-1 block text-sm font-medium text-neutral-700">Favicon</label>
                {platform.faviconUrl && <img src={platform.faviconUrl} alt="Favicon" className="mb-2 h-8 object-contain" />}
                <input id="settings-favicon" type="file" accept="image/*" onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                  className="w-full text-sm" />
              </div>
            </div>
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-sm font-bold text-neutral-900 mb-3">Contact Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="settings-contact-address" className="mb-1 block text-sm font-medium text-neutral-700">Address</label>
                  <input id="settings-contact-address" type="text" value={(platform as any).contactAddress || ""} onChange={(e) => update("contactAddress" as any, e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="settings-contact-phone" className="mb-1 block text-sm font-medium text-neutral-700">Phone</label>
                  <input id="settings-contact-phone" type="text" value={(platform as any).contactPhone || ""} onChange={(e) => update("contactPhone" as any, e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="settings-contact-email" className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
                  <input id="settings-contact-email" type="text" value={(platform as any).contactEmail || ""} onChange={(e) => update("contactEmail" as any, e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="settings-contact-hours" className="mb-1 block text-sm font-medium text-neutral-700">Working Hours</label>
                  <input id="settings-contact-hours" type="text" value={(platform as any).contactHours || ""} onChange={(e) => update("contactHours" as any, e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <Button onClick={savePlatform} disabled={saving}>
              {saving ? <><Spinner size="sm" className="mr-2" /> Saving...</> : "Save"}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "monnify" && platform && (
        <Card>
          <CardHeader><CardTitle>Monnify API Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-500">Configure Monnify payment gateway credentials. Changes take effect immediately.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-monnify-key" className="mb-1 block text-sm font-medium text-neutral-700">API Key</label>
                <input id="settings-monnify-key" type="text" value={platform.monnifyApiKey} onChange={(e) => update("monnifyApiKey", e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label htmlFor="settings-monnify-secret" className="mb-1 block text-sm font-medium text-neutral-700">Secret Key</label>
                <input id="settings-monnify-secret" type="password" value={platform.monnifySecretKey} onChange={(e) => update("monnifySecretKey", e.target.value)}
                  placeholder={platform.monnifySecretKey === "••••••••" ? "Leave blank to keep current" : ""}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label htmlFor="settings-monnify-contract" className="mb-1 block text-sm font-medium text-neutral-700">Contract Code</label>
                <input id="settings-monnify-contract" type="text" value={platform.monnifyContractCode} onChange={(e) => update("monnifyContractCode", e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label htmlFor="settings-monnify-baseurl" className="mb-1 block text-sm font-medium text-neutral-700">Base URL</label>
                <select id="settings-monnify-baseurl" value={platform.monnifyBaseUrl} onChange={(e) => update("monnifyBaseUrl", e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
                  <option value="https://sandbox.monnify.com">Sandbox</option>
                  <option value="https://api.monnify.com">Production</option>
                </select>
              </div>
            </div>
            <Button onClick={savePlatform} disabled={saving}>
              {saving ? <><Spinner size="sm" className="mr-2" /> Saving...</> : "Save"}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "smtp" && (
        <Card>
          <CardHeader><CardTitle>SMTP Email Configuration</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveSmtp} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="settings-smtp-host" className="mb-1 block text-sm font-medium text-neutral-700">SMTP Host</label>
                  <input id="settings-smtp-host" type="text" value={smtp?.host || ""} onChange={(e) => setSmtp((s) => s ? { ...s, host: e.target.value } : s)}
                    required placeholder="smtp.example.com"
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="settings-smtp-port" className="mb-1 block text-sm font-medium text-neutral-700">Port</label>
                  <input id="settings-smtp-port" type="number" value={smtp?.port || 587} onChange={(e) => setSmtp((s) => s ? { ...s, port: Number(e.target.value) } : s)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="settings-smtp-username" className="mb-1 block text-sm font-medium text-neutral-700">Username</label>
                  <input id="settings-smtp-username" type="text" value={smtp?.username || ""} onChange={(e) => setSmtp((s) => s ? { ...s, username: e.target.value } : s)}
                    required className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="settings-smtp-password" className="mb-1 block text-sm font-medium text-neutral-700">Password</label>
                  <input id="settings-smtp-password" type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder={smtp?.host ? "Leave blank to keep current" : "Required"}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="settings-smtp-from" className="mb-1 block text-sm font-medium text-neutral-700">From Email</label>
                  <input id="settings-smtp-from" type="email" value={smtp?.fromEmail || ""} onChange={(e) => setSmtp((s) => s ? { ...s, fromEmail: e.target.value } : s)}
                    required placeholder="noreply@example.com"
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="settings-smtp-name" className="mb-1 block text-sm font-medium text-neutral-700">From Name</label>
                  <input id="settings-smtp-name" type="text" value={smtp?.fromName || ""} onChange={(e) => setSmtp((s) => s ? { ...s, fromName: e.target.value } : s)}
                    placeholder="TruckLease Pro"
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" checked={smtp?.secure || false} onChange={(e) => setSmtp((s) => s ? { ...s, secure: e.target.checked } : s)}
                  className="rounded border-neutral-300" />
                Use SSL/TLS (secure connection)
              </label>
              <Button type="submit" disabled={saving}>
                {saving ? <><Spinner size="sm" className="mr-2" /> Saving...</> : "Save SMTP Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "fees" && platform && (
        <Card>
          <CardHeader><CardTitle>Fees & Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-fee-platform" className="mb-1 block text-sm font-medium text-neutral-700">Platform Fee (%)</label>
                <input id="settings-fee-platform" type="number" step="0.1" value={platform.platformFee} onChange={(e) => update("platformFee", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-neutral-400">Percentage charged per successful booking</p>
              </div>
              <div>
                <label htmlFor="settings-fee-escrow" className="mb-1 block text-sm font-medium text-neutral-700">Escrow Release Delay (hours)</label>
                <input id="settings-fee-escrow" type="number" value={platform.escrowReleaseDelay} onChange={(e) => update("escrowReleaseDelay", parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-neutral-400">Time after delivery before funds auto-release</p>
              </div>
              <div>
                <label htmlFor="settings-fee-deposit" className="mb-1 block text-sm font-medium text-neutral-700">Minimum Deposit (%)</label>
                <input id="settings-fee-deposit" type="number" step="1" value={platform.minDeposit} onChange={(e) => update("minDeposit", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-neutral-400">Minimum deposit required to secure a booking</p>
              </div>
              <div>
                <label htmlFor="settings-fee-reversal" className="mb-1 block text-sm font-medium text-neutral-700">Reversal Fee (&#x20A6;)</label>
                <input id="settings-fee-reversal" type="number" value={platform.reversalFee} onChange={(e) => update("reversalFee", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-neutral-400">Fee charged for processing a reversal request</p>
              </div>
            </div>
            <Button onClick={savePlatform} disabled={saving}>
              {saving ? <><Spinner size="sm" className="mr-2" /> Saving...</> : "Save"}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "broadcast" && (
        <Card>
          <CardHeader><CardTitle>Broadcast Notification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-500">Send an announcement to all active users or filter by role.</p>
            <div>
              <label htmlFor="broadcast-role" className="mb-1 block text-sm font-medium text-neutral-700">Target Audience</label>
              <select id="broadcast-role" value={broadcastRole} onChange={(e) => setBroadcastRole(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
                <option value="ALL">All Active Users</option>
                <option value="OWNER">Owners Only</option>
                <option value="CLIENT">Clients Only</option>
              </select>
            </div>
            <div>
              <label htmlFor="broadcast-title" className="mb-1 block text-sm font-medium text-neutral-700">Title</label>
              <input id="broadcast-title" type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" placeholder="e.g. Platform Maintenance" />
            </div>
            <div>
              <label htmlFor="broadcast-message" className="mb-1 block text-sm font-medium text-neutral-700">Message</label>
              <textarea id="broadcast-message" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} rows={4}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" placeholder="Write your announcement..." />
            </div>
            <Button onClick={sendBroadcast} disabled={saving || !broadcastTitle || !broadcastMsg}>
              {saving ? <><Spinner size="sm" className="mr-2" /> Sending...</> : "Send Broadcast"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
