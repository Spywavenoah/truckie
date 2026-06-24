"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialOtp = searchParams.get("otp") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(initialOtp);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(!!initialOtp);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (initialEmail && initialOtp) {
      fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: initialEmail, otp: initialOtp }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setSuccess(true);
            setTimeout(() => router.push("/auth/login"), 2000);
          } else {
            setError(data.error || "Verification failed");
            setAutoVerifying(false);
          }
        })
        .catch(() => {
          setError("An error occurred");
          setAutoVerifying(false);
        });
    }
  }, []);

  async function resendCode() {
    setResending(true);
    setResendSent(false);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setResendSent(true);
      } else {
        setError(data.error || "Failed to resend");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-neutral-900">Email Verified!</h2>
        <p className="mt-2 text-sm text-neutral-500">Redirecting to login...</p>
      </div>
    );
  }

  if (autoVerifying) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-neutral-900">Verifying...</h2>
        <p className="mt-2 text-sm text-neutral-500">Please wait while we verify your email.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Verify Email</h1>
        <p className="mt-2 text-sm text-neutral-500">Enter the 6-digit code sent to your email.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label htmlFor="verify-email" className="block text-sm font-medium text-neutral-700">Email</label>
          <input id="verify-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm" />
        </div>

        <div>
          <label htmlFor="verify-code" className="block text-sm font-medium text-neutral-700">Verification Code</label>
          <input id="verify-code" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
            placeholder="000000"
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-center text-2xl tracking-widest" />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <><Spinner size="sm" className="mr-2" /> Verifying...</> : "Verify Email"}
        </Button>
      </form>

      <div className="text-center">
        <button type="button" onClick={resendCode} disabled={resending}
          className="text-sm text-accent-light hover:text-accent font-medium">
          {resending ? <><Spinner size="sm" className="mr-1" /> Sending...</> : resendSent ? "Code sent!" : "Resend verification code"}
        </button>
      </div>

      <p className="text-center text-sm text-neutral-500">
        Already verified? <Link href="/auth/login" className="text-accent-light hover:text-accent font-medium">Sign in</Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-neutral-400">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
