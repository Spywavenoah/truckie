import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getOwnerListings } from "@/lib/dashboard/owner";
import { formatCurrency } from "@/lib/utils";
import { ListingListActions } from "@/components/listing-list-actions";

const statusVariant: Record<string, "success" | "warning" | "secondary"> = {
  AVAILABLE: "success",
  HIRED: "success",
  MAINTENANCE: "warning",
  INACTIVE: "secondary",
};

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function OwnerListingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className="py-8 text-center text-sm text-neutral-400">You must be signed in to view this page.</p>;
  }
  let assets;
  try {
    assets = await getOwnerListings(session.user.id);
  } catch {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Listings</h1>
            <p className="mt-1 text-sm text-neutral-500">Manage your listed assets.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/owner/listings/new">Add Listing</Link>
          </Button>
        </div>
        <p className="py-8 text-center text-sm text-neutral-400">Failed to load listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Listings</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your listed assets.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/owner/listings/new">Add Listing</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No items yet. Add your first listing.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">ID</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Title</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Type</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Price</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Bookings</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Status</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {assets.map((a) => (
                    <tr key={a.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{a.id.substring(0, 8).toUpperCase()}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Link href={`/dashboard/owner/listings/${a.id}`} className="font-medium text-neutral-900 hover:text-accent-light">
                          {a.title}
                        </Link>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{formatStatus(a.type)}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-success">
                        {a.pricePerDay ? formatCurrency(a.pricePerDay) + "/day" : "—"}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{a._count.bookings}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusVariant[a.availabilityStatus] || "secondary"}>
                          {formatStatus(a.availabilityStatus)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <ListingListActions assetId={a.id} availabilityStatus={a.availabilityStatus} />
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
