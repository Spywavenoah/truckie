"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "CLIENT",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        toast(data.error || "Registration failed", { variant: "error" });
        setLoading(false);
        return;
      }

      toast("Account created!", { variant: "success", description: "Check your email for the verification code." });
      router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Create account</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Join TruckLease Pro as an asset owner or client
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-neutral-700">
            I want to join as
          </label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
          >
            <option value="CLIENT">Client — I want to hire trucks/equipment</option>
            <option value="OWNER">Owner — I want to list my assets</option>
          </select>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={form.fullName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
            placeholder="+234 801 234 5678"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
            placeholder="Min. 8 chars, upper, lower, number, symbol"
          />
          <p className="mt-1 text-xs text-neutral-400">
            At least 8 characters with uppercase, lowercase, number, and symbol
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light"
            placeholder="Repeat your password"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <><Spinner size="sm" className="mr-2" /> Creating account...</> : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-accent-light hover:text-accent font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
