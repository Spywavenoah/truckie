"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role === "OWNER" ? "owner" : "client";
  const dashboardSettings = `/dashboard/${role}/settings`;
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function loadSetup() {
      try {
        const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
        const json = await res.json();
        if (json.success) {
          setQrCode(json.data.qrCode);
          setSecret(json.data.secret);
        } else {
          setError(json.error || "Failed to setup 2FA");
        }
      } catch {
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadSetup();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    const token = code.join("");

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        setVerifying(false);
        return;
      }

      router.push(dashboardSettings);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">Setting up 2FA</h1>
          <p className="mt-2 text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Set up Two-Factor Authentication</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Scan the QR code with your authenticator app
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        {qrCode ? (
          <img src={qrCode} alt="2FA QR Code" className="rounded-lg border-2 border-neutral-200 p-4" />
        ) : (
          <p className="text-sm text-neutral-500">Failed to load QR code</p>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-neutral-600">
          Or enter this secret manually: <code className="bg-neutral-100 px-2 py-1 rounded">{secret}</code>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700 mb-4">
            Enter the 6-digit code from your authenticator app to verify:
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              aria-label={`Digit ${index + 1} of verification code`}
              className="h-12 w-10 rounded-md border border-neutral-300 text-center text-lg font-bold text-neutral-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
            />
          ))}
        </div>

        <Button type="submit" disabled={verifying || code.some((d) => !d)} className="w-full">
          {verifying ? "Verifying..." : "Verify and Enable 2FA"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        <Link href={dashboardSettings} className="text-accent-light hover:text-accent">
          Cancel
        </Link>
      </p>
    </div>
  );
}