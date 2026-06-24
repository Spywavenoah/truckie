import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { AddToCartButton } from "./add-to-cart-button";
import { SaveButton } from "./save-button";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, fullName: true, email: true, phone: true } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!asset || !asset.isApproved || asset.availabilityStatus === "INACTIVE") notFound();

  const priceDisplay = asset.pricePerDay != null
    ? `${formatCurrency(asset.pricePerDay)}/day`
    : asset.pricePerHour != null
      ? `${formatCurrency(asset.pricePerHour)}/hr`
      : asset.pricePerTon != null
        ? `${formatCurrency(asset.pricePerTon)}/ton`
        : "Contact for price";

  const typeLabel = asset.type === "TRUCK" ? "Truck" : asset.type === "EQUIPMENT" ? "Equipment" : "Material";
  const primaryImage = asset.images.find((i) => i.isPrimary) || asset.images[0];

  return (
    <div>
      <div className="brand-header-band bg-accent -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:-px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/listings" className="text-sm text-neutral-200 hover:text-white">&larr; Back to Marketplace</Link>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex h-64 items-center justify-center rounded-lg bg-neutral-100 sm:h-80 lg:h-96">
              {primaryImage ? (
                <img src={primaryImage.url} alt={asset.title} className="h-full w-full rounded-lg object-cover" />
              ) : (
                <span className="font-heading text-4xl font-bold text-neutral-300">
                  {asset.title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                </span>
              )}
            </div>
            {asset.images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {asset.images.map((img) => (
                  <div key={img.id} className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {typeLabel}
            </span>
            <h1 className="mt-2 font-heading text-2xl font-bold text-neutral-900">{asset.title}</h1>
            <p className="mt-1 font-mono text-2xl font-bold text-success">{priceDisplay}</p>

            {asset.description && (
              <p className="mt-4 text-neutral-600">{asset.description}</p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {asset.make && (
                <div><span className="font-medium text-neutral-900">Make:</span> {asset.make}</div>
              )}
              {asset.model && (
                <div><span className="font-medium text-neutral-900">Model:</span> {asset.model}</div>
              )}
              {asset.year && (
                <div><span className="font-medium text-neutral-900">Year:</span> {asset.year}</div>
              )}
              {asset.capacity && (
                <div><span className="font-medium text-neutral-900">Capacity:</span> {asset.capacity} {asset.unit || "tons"}</div>
              )}
              {asset.state && (
                <div><span className="font-medium text-neutral-900">Location:</span> {asset.state}{asset.lga ? `, ${asset.lga}` : ""}</div>
              )}
            </div>

            <div className="mt-6 border-t border-neutral-200 pt-4">
              <p className="text-sm text-neutral-500">Listed by <Link href={`/owners/${asset.owner.id}`} className="font-medium text-neutral-900 hover:text-accent">{asset.owner.fullName}</Link></p>
            </div>

            {session?.user ? (
              <div className="mt-6 flex gap-3">
                <AddToCartButton asset={asset} session={session} />
                <SaveButton assetId={asset.id} />
              </div>
            ) : (
              <div className="mt-6 flex gap-3">
                <Link
                  href="/auth/login"
                  className="btn-primary flex-1 text-center"
                >
                  Sign in to hire
                </Link>
                <SaveButton assetId={asset.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
