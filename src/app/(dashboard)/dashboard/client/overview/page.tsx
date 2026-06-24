import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getClientOverview } from "@/lib/dashboard/client";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusBadge: Record<string, "warning" | "default" | "success" | "secondary" | "destructive"> = {
  PENDING: "warning",
  ACCEPTED: "default",
  IN_PROGRESS: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  REJECTED: "destructive",
  DISPUTED: "destructive",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  DISPUTED: "Disputed",
};

export default async function ClientOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className="py-8 text-center text-sm text-neutral-400">Please sign in to view your dashboard.</p>;
  }

  let data;
  try {
    data = await getClientOverview(session.user.id);
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Client Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your hires, bookings, and account.</p>
        </div>
        <p className="py-8 text-center text-sm text-danger">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { stats, recentBookings } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Client Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your hires, bookings, and account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Active Hires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">{stats.activeBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{stats.completedBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Total Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{formatCurrency(stats.totalSpent)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              No bookings yet. Browse the marketplace to find trucks and equipment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Booking ID</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Asset</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Owner</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Dates</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Amount</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{b.id}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-neutral-900">{b.asset.title}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{b.owner.fullName}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">
                        {formatDate(b.startDate)} - {formatDate(b.endDate)}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-success">{formatCurrency(b.totalCost)}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusBadge[b.status]}>
                          {statusLabel[b.status]}
                        </Badge>
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
