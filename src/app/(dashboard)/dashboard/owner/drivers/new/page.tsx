"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";

export default function NewDriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    licenseClass: "",
    licenseExpiry: "",
    address: "",
    state: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body: Record<string, unknown> = { fullName: form.fullName };
      if (form.phone) body.phone = form.phone;
      if (form.email) body.email = form.email;
      if (form.licenseNumber) body.licenseNumber = form.licenseNumber;
      if (form.licenseClass) body.licenseClass = form.licenseClass;
      if (form.licenseExpiry) body.licenseExpiry = new Date(form.licenseExpiry).toISOString();
      if (form.address) body.address = form.address;
      if (form.state) body.state = form.state;

      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast("Driver added successfully", { variant: "success" });
        router.push("/dashboard/owner/drivers");
        router.refresh();
      } else {
        toast(data.error || "Failed to add driver", { variant: "error" });
      }
    } catch {
      toast("An error occurred", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Add Driver</h1>
        <p className="mt-1 text-sm text-neutral-500">Register a new driver for your fleet.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} required placeholder="e.g. Chinedu Okonkwo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 08031234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="driver@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input id="licenseNumber" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="e.g. LA123456" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseClass">License Class</Label>
                <Input id="licenseClass" name="licenseClass" value={form.licenseClass} onChange={handleChange} placeholder="e.g. E, G" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">License Expiry</Label>
                <Input id="licenseExpiry" name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" value={form.state} onChange={handleChange} placeholder="e.g. Lagos" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="e.g. 123 Marina, Lagos" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading || !form.fullName}>
                {loading ? <><Spinner size="sm" className="mr-2" /> Saving...</> : "Add Driver"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
