import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminDashboard } from "@/lib/dashboard/admin";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart } from "@/components/charts";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login");

  let dashboard;
  try {
    dashboard = await getAdminDashboard();
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Platform overview, revenue, and activity at a glance.</p>
        </div>
        <p className="text-sm text-danger">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Platform overview, revenue, and activity at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{dashboard.users.total}</p>
            <p className="mt-1 text-xs text-neutral-400">
              {dashboard.users.owners} owners &middot; {dashboard.users.clients} clients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{dashboard.listings.total}</p>
            <p className="mt-1 text-xs text-neutral-400">
              {dashboard.listings.pending} pending approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Platform Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{formatCurrency(dashboard.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Pending Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{dashboard.pendingWithdrawals}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.users.total > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Total Users</span>
                  <span className="font-semibold text-neutral-900">{dashboard.users.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Owners</span>
                  <span className="font-semibold text-neutral-900">{dashboard.users.owners}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Clients</span>
                  <span className="font-semibold text-neutral-900">{dashboard.users.clients}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Logins (24h)</span>
                  <span className="font-semibold text-neutral-900">{dashboard.recentLogins}</span>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-neutral-400">No recent registrations</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.listings.pending > 0 || dashboard.openTickets > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Listings Awaiting Approval</span>
                  <span className="font-semibold text-neutral-900">{dashboard.listings.pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Active Bookings</span>
                  <span className="font-semibold text-neutral-900">{dashboard.bookings.active}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Pending Bookings</span>
                  <span className="font-semibold text-neutral-900">{dashboard.bookings.pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Open Support Tickets</span>
                  <span className="font-semibold text-neutral-900">{dashboard.openTickets}</span>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-neutral-400">No pending approvals</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <SimpleBarChart data={dashboard.charts.revenueByDay.map((d) => ({ ...d, displayValue: formatCurrency(d.value) }))} title="Revenue (30 days)" valueKey="value" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <SimpleBarChart data={dashboard.charts.bookingsByDay} title="Bookings (30 days)" valueKey="count" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <SimpleBarChart data={dashboard.charts.usersByDay} title="New Users (30 days)" valueKey="count" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
