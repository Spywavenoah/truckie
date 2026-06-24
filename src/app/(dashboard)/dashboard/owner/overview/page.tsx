import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getOwnerOverview } from "@/lib/dashboard/owner";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusBadge: Record<string, "warning" | "success" | "default" | "destructive"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  IN_PROGRESS: "success",
  COMPLETED: "default",
  CANCELLED: "destructive",
  DISPUTED: "destructive",
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default async function OwnerOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className="py-8 text-center text-sm text-neutral-400">You must be signed in to view this page.</p>;
  }
  let data;
  try {
    data = await getOwnerOverview(session.user.id);
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Owner Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Overview of your fleet, earnings, and activity.</p>
        </div>
        <p className="py-8 text-center text-sm text-neutral-400">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { stats, recentBookings } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Owner Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Overview of your fleet, earnings, and activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{stats.totalListings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Active Hires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{stats.activeBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{formatCurrency(stats.totalEarnings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{stats.pendingRequests}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              No recent activity to show. Start by listing your first asset.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Asset</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Client</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Status</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-neutral-900">{b.asset.title}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{b.client.fullName}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusBadge[b.status] || "default"}>
                          {formatStatus(b.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{formatDate(b.createdAt)}</td>
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
