import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getOwnerBookings } from "@/lib/dashboard/owner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OwnerBookingActions } from "@/components/booking-actions";

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

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className="py-8 text-center text-sm text-neutral-400">You must be signed in to view this page.</p>;
  }
  let bookings;
  try {
    bookings = await getOwnerBookings(session.user.id);
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Bookings</h1>
          <p className="mt-1 text-sm text-neutral-500">Incoming hire requests and active bookings.</p>
        </div>
        <p className="py-8 text-center text-sm text-neutral-400">Failed to load bookings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Bookings</h1>
          <p className="mt-1 text-sm text-neutral-500">Incoming hire requests and active bookings.</p>
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
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Client</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Date</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Amount</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Status</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{b.id.substring(0, 8).toUpperCase()}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-neutral-900">{b.asset.title}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{b.client.fullName}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{formatDate(b.startDate)} – {formatDate(b.endDate)}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-success">{formatCurrency(b.totalCost)}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusBadge[b.status] || "default"}>
                          {formatStatus(b.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <OwnerBookingActions bookingId={b.id} status={b.status} />
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
