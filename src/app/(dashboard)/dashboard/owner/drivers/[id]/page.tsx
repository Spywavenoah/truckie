"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Driver {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  licenseNumber: string | null;
  licenseClass: string | null;
  licenseExpiry: string | null;
  address: string | null;
  state: string | null;
  photoUrl: string | null;
  status: string;
  dateOfJoining: string | null;
  createdAt: string;
}

interface DriverPayment {
  id: string;
  paymentType: string;
  amount: number;
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
}

const paymentTypeLabels: Record<string, string> = {
  SALARY: "Salary",
  ALLOWANCE: "Allowance",
  BONUS: "Bonus",
  DEDUCTION: "Deduction",
};

export default function DriverProfilePage() {
  const params = useParams();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [payments, setPayments] = useState<DriverPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driverRes, paymentsRes] = await Promise.all([
          fetch(`/api/drivers/${params.id}`),
          fetch(`/api/drivers/${params.id}/payments`),
        ]);
        const driverJson = await driverRes.json();
        if (driverJson.success) setDriver(driverJson.data);
        const paymentsJson = await paymentsRes.json();
        if (paymentsJson.success) setPayments(paymentsJson.data);
      } catch (err) {
        console.error("Failed to load driver data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-neutral-400">Loading driver profile...</p>;
  }

  if (!driver) {
    return <p className="py-8 text-center text-sm text-danger">Driver not found.</p>;
  }

  const isLicenseExpiring =
    driver.licenseExpiry && new Date(driver.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const isLicenseExpired =
    driver.licenseExpiry && new Date(driver.licenseExpiry) < new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Driver Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">View driver details and payment history.</p>
      </div>

      {(isLicenseExpired || isLicenseExpiring) && (
        <Card className={`border ${isLicenseExpired ? "border-danger bg-red-50" : "border-warning bg-amber-50"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">{isLicenseExpired ? "Expired" : "Warning"}</span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {isLicenseExpired
                    ? "License has expired!"
                    : "License is expiring soon!"}
                </p>
                <p className="text-xs text-neutral-600">
                  License {isLicenseExpired ? "expired" : "expires"} on{" "}
                  {new Date(driver.licenseExpiry!).toLocaleDateString("en-NG", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl font-bold text-white">
              {driver.fullName.charAt(0)}
            </div>
            <h2 className="text-lg font-bold text-neutral-900">{driver.fullName}</h2>
            <Badge
              variant={
                driver.status === "ACTIVE"
                  ? "success"
                  : driver.status === "ON_LEAVE"
                  ? "warning"
                  : "secondary"
              }
              className="mt-2"
            >
              {driver.status === "ON_LEAVE" ? "On Leave" : driver.status.charAt(0) + driver.status.slice(1).toLowerCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Phone</p>
                <p className="text-sm font-medium text-neutral-900">{driver.phone || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Email</p>
                <p className="text-sm text-neutral-900">{driver.email || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">License Number</p>
                <p className="text-sm font-mono text-neutral-900">{driver.licenseNumber || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">License Class</p>
                <p className="text-sm text-neutral-900">{driver.licenseClass || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">License Expiry</p>
                <p className={`text-sm font-medium ${isLicenseExpired ? "text-danger" : isLicenseExpiring ? "text-warning" : "text-neutral-900"}`}>
                  {driver.licenseExpiry
                    ? new Date(driver.licenseExpiry).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">Date Joined</p>
                <p className="text-sm text-neutral-900">
                  {driver.dateOfJoining
                    ? new Date(driver.dateOfJoining).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
              {driver.address && (
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-neutral-500">Address</p>
                  <p className="text-sm text-neutral-900">{driver.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400">No payments recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Type</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Amount</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Period</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Description</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Paid At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={p.paymentType === "DEDUCTION" ? "destructive" : "default"}>
                          {paymentTypeLabels[p.paymentType] || p.paymentType}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-success">
                        ₦{p.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">
                        {p.periodStart && p.periodEnd
                          ? `${new Date(p.periodStart).toLocaleDateString("en-NG", { day: "numeric", month: "short" })} - ${new Date(p.periodEnd).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{p.description || "-"}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">
                        {p.paidAt
                          ? new Date(p.paidAt).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
