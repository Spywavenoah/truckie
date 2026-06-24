"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function TwoFactorPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

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
        setLoading(false);
        return;
      }

      const role = session?.user?.role || "CLIENT";
      const dashboardMap: Record<string, string> = {
        OWNER: "/dashboard/owner/overview",
        CLIENT: "/dashboard/client/overview",
        ADMIN: "/admin/dashboard",
      };
      router.push(dashboardMap[role] || "/dashboard/client/overview");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Two-factor authentication</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

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

        <Button type="submit" disabled={loading || code.some((d) => !d)} className="w-full">
          {loading ? <><Spinner size="sm" className="mr-2" /> Verifying...</> : "Verify"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        <Link href="/auth/login" className="text-accent-light hover:text-accent">
          Back to login
        </Link>
      </p>
    </div>
  );
}
