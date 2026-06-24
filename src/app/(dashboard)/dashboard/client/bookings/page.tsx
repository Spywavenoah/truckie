import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getClientBookings } from "@/lib/dashboard/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClientBookingActions } from "@/components/booking-actions";

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

export default async function ClientBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className="py-8 text-center text-sm text-neutral-400">Please sign in to view your bookings.</p>;
  }

  let bookings;
  try {
    bookings = await getClientBookings(session.user.id);
  } catch {
    return <p className="py-8 text-center text-sm text-neutral-400">Failed to load bookings.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Bookings</h1>
          <p className="mt-1 text-sm text-neutral-500">Track your hired assets and booking requests.</p>
        </div>
        <a href="/api/bookings/export" download className="btn-secondary text-sm">Export CSV</a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Booking ID</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Asset</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Dates</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Amount</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Status</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{b.id}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-neutral-900">{b.asset.title}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">
                        {formatDate(b.startDate)} - {formatDate(b.endDate)}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-success">{formatCurrency(b.totalCost)}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusBadge[b.status]}>
                          {statusLabel[b.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <ClientBookingActions bookingId={b.id} status={b.status} assetId={b.asset.id} />
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
