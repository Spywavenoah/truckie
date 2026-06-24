"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (registered === "true") {
      toast("Registration successful!", { variant: "success", description: "Please check your email for the verification code." });
    }
  }, [registered]);

  async function resendVerification() {
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
        toast("Verification code sent!", { variant: "success", description: "Check your email for the new code." });
      } else {
        toast(data.error || "Failed to resend", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("verify your email")) {
          setError("Please verify your email before logging in. Check your inbox for the OTP.");
          toast("Email not verified", { variant: "warning", description: "Please verify your email before logging in." });
        } else {
          setError("Invalid email or password");
          toast("Login failed", { variant: "error", description: "Invalid email or password" });
        }
        setLoading(false);
        return;
      }

      toast("Welcome back!", { variant: "success" });

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.requires2FA) {
        router.push("/auth/2fa");
        return;
      }

      if (!session?.user?.has2FA) {
        toast("Tip: Set up two-factor authentication to secure your account.", { variant: "info" });
      }

      const role = session?.user?.role || "CLIENT";
      const dashboardMap: Record<string, string> = {
        OWNER: "/dashboard/owner/overview",
        CLIENT: "/dashboard/client/overview",
        ADMIN: "/admin/dashboard",
      };
      router.push(callbackUrl || dashboardMap[role] || "/dashboard/client/overview");
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
        <h1 className="text-3xl font-bold text-neutral-900">Welcome back</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Sign in to your TruckLease Pro account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {error.includes("verify your email") && (
          <div className="space-y-2 text-center text-sm">
            <Link href={`/auth/verify-email?email=${encodeURIComponent(email)}`} className="block text-accent-light hover:text-accent font-medium">
              Enter verification code
            </Link>
            <button type="button" onClick={resendVerification} disabled={resending}
              className="text-neutral-500 hover:text-neutral-700 underline">
              {resending ? "Sending..." : resendSent ? "Code sent!" : "Resend verification code"}
            </button>
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
            placeholder="Enter your password"
          />
          <div className="mt-1 text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-accent-light hover:text-accent"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <><Spinner size="sm" className="mr-2" /> Signing in...</> : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-accent-light hover:text-accent font-medium">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-400">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
