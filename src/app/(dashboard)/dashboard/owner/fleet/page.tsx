import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getOwnerListings } from "@/lib/dashboard/owner";

const statusBadge: Record<string, "success" | "warning" | "secondary"> = {
  AVAILABLE: "success",
  HIRED: "success",
  MAINTENANCE: "warning",
  INACTIVE: "secondary",
};

export default async function FleetPage() {
  const session = await auth();
  if (!session?.user?.id) return <p className="py-8 text-center text-sm text-neutral-400">Please sign in.</p>;

  let assets;
  try {
    assets = await getOwnerListings(session.user.id);
  } catch {
    return <p className="py-8 text-center text-sm text-neutral-400">Failed to load fleet data.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Fleet</h1>
          <p className="mt-1 text-sm text-neutral-500">Overview of all your assets and their current status.</p>
        </div>
        <Link href="/dashboard/owner/listings/new"><Button>Add Asset</Button></Link>
      </div>

      {assets.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">No assets in your fleet yet. <Link href="/dashboard/owner/listings/new" className="text-accent-light hover:text-accent">Add your first asset</Link></p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Link key={asset.id} href={`/dashboard/owner/listings/${asset.id}`} className="block">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{asset.title}</CardTitle>
                    <Badge variant={statusBadge[asset.availabilityStatus] || "secondary"}>
                      {asset.availabilityStatus === "AVAILABLE" ? "Active" : asset.availabilityStatus === "HIRED" ? "Hired" : asset.availabilityStatus === "MAINTENANCE" ? "Maintenance" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Type:</span>
                    <span className="text-neutral-900">{asset.type} {asset.category ? `· ${asset.category}` : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Plate:</span>
                    <span className="font-mono text-neutral-900">{asset.plateNumber || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Rate:</span>
                    <span className="text-neutral-900">{asset.pricePerDay ? `₦${asset.pricePerDay.toLocaleString()}/day` : "—"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
