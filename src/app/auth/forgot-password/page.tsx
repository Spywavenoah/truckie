"use client";

import { useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Check your email</h1>
        <p className="text-neutral-500">
          If an account exists with that email, we&apos;ve sent password reset instructions.
        </p>
        <Button asChild>
          <Link href="/auth/login">Back to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Forgot password</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
            placeholder="you@example.com"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <><Spinner size="sm" className="mr-2" /> Sending...</> : "Send reset link"}
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
