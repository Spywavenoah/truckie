import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getOwnerDrivers } from "@/lib/dashboard/owner";

const statusBadge: Record<string, "success" | "warning" | "secondary"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  AVAILABLE: "secondary",
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default async function DriversPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className="py-8 text-center text-sm text-neutral-400">You must be signed in to view this page.</p>;
  }
  let drivers;
  try {
    drivers = await getOwnerDrivers(session.user.id);
  } catch {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Drivers</h1>
            <p className="mt-1 text-sm text-neutral-500">Manage your drivers and assignments.</p>
          </div>
          <Link href="/dashboard/owner/drivers/new"><Button>Add Driver</Button></Link>
        </div>
        <p className="py-8 text-center text-sm text-neutral-400">Failed to load drivers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Drivers</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your drivers and assignments.</p>
        </div>
        <Link href="/dashboard/owner/drivers/new"><Button>Add Driver</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No drivers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">ID</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Name</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Phone</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">License</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Status</th>
                    <th className="pb-2 px-3 md:pb-3 md:px-4 font-heading font-bold text-neutral-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 font-mono text-xs text-neutral-500">{d.id.substring(0, 8).toUpperCase()}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-neutral-900">{d.fullName}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{d.phone || "—"}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3 text-neutral-600">{d.licenseNumber || "—"}</td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Badge variant={statusBadge[d.status] || "secondary"}>
                          {formatStatus(d.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3">
                        <Link href={`/dashboard/owner/drivers/${d.id}`}><Button variant="outline" size="sm">View</Button></Link>
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
