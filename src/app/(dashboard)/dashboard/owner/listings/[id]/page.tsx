import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ListingActions } from "@/components/listing-actions";
import { prisma } from "@/lib/prisma";

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  AVAILABLE: "success",
  HIRED: "warning",
  MAINTENANCE: "warning",
  INACTIVE: "secondary",
};

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let asset;
  try {
    asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        owner: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });
  } catch {
    notFound();
  }

  if (!asset) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">{asset.title}</h1>
            <Badge variant={statusVariant[asset.availabilityStatus] || "secondary"}>
              {asset.availabilityStatus}
            </Badge>
            {asset.isApproved ? (
              <Badge variant="success">Approved</Badge>
            ) : (
              <Badge variant="warning">Pending Approval</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {asset.type} · {asset.category || "No category"} · ID: {asset.id}
          </p>
        </div>
        <ListingActions assetId={id} isApproved={asset.isApproved} availabilityStatus={asset.availabilityStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Images */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            {asset.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {asset.images
                  .map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-video overflow-hidden rounded-md border border-neutral-200"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {img.isPrimary && (
                        <Badge className="absolute left-2 top-2">Primary</Badge>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-neutral-400">No images uploaded.</p>
            )}
          </CardContent>
        </Card>

        {/* Specs */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SpecRow label="Make" value={asset.make} />
            <SpecRow label="Model" value={asset.model} />
            <SpecRow label="Year" value={asset.year?.toString()} />
            {asset.type === "TRUCK" && <SpecRow label="Plate Number" value={asset.plateNumber} />}
            <SpecRow label="Capacity" value={asset.capacity ? `${asset.capacity} ${asset.unit || ""}` : null} />
          </CardContent>
        </Card>
      </div>

      {/* Description & Pricing */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700">
              {asset.description || "No description provided."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {asset.pricePerDay != null && (
              <SpecRow label="Price per Day" value={formatCurrency(asset.pricePerDay)} />
            )}
            {asset.pricePerHour != null && (
              <SpecRow label="Price per Hour" value={formatCurrency(asset.pricePerHour)} />
            )}
            {asset.pricePerTon != null && (
              <SpecRow label="Price per Ton" value={formatCurrency(asset.pricePerTon)} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location & Owner */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SpecRow label="Location" value={asset.location} />
            <SpecRow label="State" value={asset.state} />
            <SpecRow label="LGA" value={asset.lga} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SpecRow label="Name" value={asset.owner.fullName} />
            <SpecRow label="Phone" value={asset.owner.phone} />
            <SpecRow label="Email" value={asset.owner.email} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/owner/listings/${asset.id}/maintenance`}>Maintenance Logs</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/owner/listings/${asset.id}/fuel`}>Fuel Logs</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-neutral-400">
        Created: {formatDate(asset.createdAt)} · Last updated: {formatDate(asset.updatedAt)}
      </p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-900">{value || "—"}</span>
    </div>
  );
}
