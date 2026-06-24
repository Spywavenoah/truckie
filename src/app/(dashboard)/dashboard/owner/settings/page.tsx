"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  phoneVerified: string | null;
  role: string;
  bankCode: string | null;
  bankAccountNumber: string | null;
  transferPin: string | null;
  twoFactorAuth: { enabled: boolean } | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "" });
  const [phoneVerified, setPhoneVerified] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [twoFA, setTwoFA] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"idle" | "sent" | "verified">("idle");
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const u = res.data as UserProfile;
          setProfile({ fullName: u.fullName, email: u.email, phone: u.phone || "" });
          setPhoneVerified(u.phoneVerified);
          setTwoFA(u.twoFactorAuth?.enabled || false);
          if (u.phoneVerified) setPhoneStep("verified");
        }
      })
      .catch((e) => console.error("owner settings: fetch failed", e));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: profile.fullName, phone: profile.phone }),
      });
      const json = await res.json();
      if (json.success) {
        setProfileMsg("Profile updated successfully");
        toast("Profile updated", { variant: "success" });
        updateSession();
      } else {
        setProfileMsg(json.error || "Failed to update profile");
        toast(json.error || "Failed to update profile", { variant: "error" });
      }
    } catch {
      setProfileMsg("An error occurred");
      toast("An error occurred", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassMsg("");
    if (passwords.newPass !== passwords.confirm) {
      setPassMsg("Passwords do not match");
      return;
    }
    if (passwords.newPass.length < 6) {
      setPassMsg("Password must be at least 6 characters");
      return;
    }
    try {
      const res = await fetch("/api/users/me/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      const json = await res.json();
      setPassMsg(json.message || json.error || "Password changed");
      if (json.success) {
        toast("Password changed", { variant: "success" });
        setPasswords({ current: "", newPass: "", confirm: "" });
      } else {
        toast(json.error || "Failed to change password", { variant: "error" });
      }
    } catch {
      setPassMsg("An error occurred");
      toast("An error occurred", { variant: "error" });
    }
  }

  async function toggle2FA() {
    router.push(twoFA ? "/auth/2fa" : "/auth/2fa/setup");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your profile and security preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="owner-name" className="block text-sm font-medium text-neutral-700">Full Name</label>
                <input
                  id="owner-name"
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                />
              </div>
              <div>
                <label htmlFor="owner-email" className="block text-sm font-medium text-neutral-700">Email</label>
                <input
                  id="owner-email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="mt-1 block w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
                />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor="owner-phone" className="block text-sm font-medium text-neutral-700">Phone</label>
                <input
                  id="owner-phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                />
              </div>
              <div className="flex items-center gap-2 pb-0.5">
                {phoneStep === "verified" ? (
                  <span className="text-xs text-success font-medium">&#10003; Verified</span>
                ) : (
                  <Button type="button" size="sm" variant="outline" disabled={sendingOtp || !profile.phone || phoneStep === "sent"}
                    onClick={async () => {
                      setSendingOtp(true);
                      try {
                        const res = await fetch("/api/users/me/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: profile.phone }) });
                        const json = await res.json();
                        if (json.success) { setPhoneStep("sent"); toast("OTP sent via email", { variant: "success" }); }
                        else toast(json.error, { variant: "error" });
                      } catch { toast("Failed to send OTP", { variant: "error" }); }
                      setSendingOtp(false);
                    }}
                  >
                    {sendingOtp ? <Spinner size="sm" /> : phoneStep === "sent" ? "Resend" : "Verify"}
                  </Button>
                )}
              </div>
            </div>
            {phoneStep === "sent" && (
              <div className="flex items-center gap-2">
                <input
                  className="mt-1 block w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  placeholder="Enter OTP"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                />
                <Button type="button" size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/users/me/verify-phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: phoneOtp }) });
                      const json = await res.json();
                      if (json.success) { setPhoneStep("verified"); setPhoneVerified(new Date().toISOString()); toast("Phone verified!", { variant: "success" }); }
                      else toast(json.error, { variant: "error" });
                    } catch { toast("Verification failed", { variant: "error" }); }
                  }}
                >Confirm</Button>
              </div>
            )}
            {profileMsg && (
              <p className={`text-sm ${profileMsg.includes("successfully") ? "text-success" : "text-red-600"}`}>
                {profileMsg}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? <><Spinner size="sm" className="mr-2" /> Saving...</> : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label htmlFor="owner-current-pass" className="block text-sm font-medium text-neutral-700">Current Password</label>
              <input
                id="owner-current-pass"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="owner-new-pass" className="block text-sm font-medium text-neutral-700">New Password</label>
                <input
                  id="owner-new-pass"
                  type="password"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                />
              </div>
              <div>
                <label htmlFor="owner-confirm-pass" className="block text-sm font-medium text-neutral-700">Confirm Password</label>
                <input
                  id="owner-confirm-pass"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
                />
              </div>
            </div>
            {passMsg && (
              <p className={`text-sm ${passMsg.includes("successful") || passMsg.includes("changed") ? "text-success" : "text-red-600"}`}>
                {passMsg}
              </p>
            )}
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">2FA via Authenticator App</p>
              <p className="text-sm text-neutral-500">Add an extra layer of security to your account.</p>
            </div>
            <button
              onClick={toggle2FA}
              role="switch"
              aria-checked={twoFA}
              aria-label="Toggle two-factor authentication"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFA ? "bg-success" : "bg-neutral-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFA ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
