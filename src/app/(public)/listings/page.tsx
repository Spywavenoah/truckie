import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { FilterControls } from "./filter-controls";

export const dynamic = "force-dynamic";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const sp = await searchParams;

  const typeFilter = sp.type as string | undefined;
  const stateFilter = sp.state as string | undefined;
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const sort = (sp.sort as string) || "newest";

  const priceFields = ["pricePerDay", "pricePerHour", "pricePerTon"] as const;

  const where: Record<string, unknown> = { isApproved: true, availabilityStatus: "AVAILABLE" };

  if (typeFilter) {
    where.type = typeFilter.toUpperCase();
  }

  if (stateFilter) {
    where.state = stateFilter;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.OR = priceFields.map((field) => {
      const cond: Record<string, unknown> = {};
      if (minPrice !== undefined) cond.gte = minPrice;
      if (maxPrice !== undefined) cond.lte = maxPrice;
      return { [field]: cond };
    });
  }

  const orderBy: Record<string, string> =
    sort === "price-asc" ? { pricePerDay: "asc" } : sort === "price-desc" ? { pricePerDay: "desc" } : { createdAt: "desc" };

  const assets = await prisma.asset.findMany({
    where: where as any,
    include: {
      owner: { select: { fullName: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy,
  });

  const states = await prisma.asset.findMany({
    where: { isApproved: true, state: { not: null } },
    select: { state: true },
    distinct: ["state"],
    orderBy: { state: "asc" },
  });

  const uniqueStates = [...new Set(states.map((s) => s.state).filter(Boolean))] as string[];

  return (
    <div>
      <div className="brand-header-band bg-accent mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">Marketplace</h1>
          <p className="mt-2 text-neutral-200">Browse trucks, equipment, and materials available for hire.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterControls states={uniqueStates} />

        <div className="flex-1">
          <p className="mb-4 text-sm text-neutral-500">{assets.length} assets found</p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
              const priceDisplay = asset.pricePerDay
                ? `${formatCurrency(asset.pricePerDay)}/day`
                : asset.pricePerHour
                  ? `${formatCurrency(asset.pricePerHour)}/hr`
                  : asset.pricePerTon
                    ? `${formatCurrency(asset.pricePerTon)}/ton`
                    : "Contact for price";
              const typeLabel = asset.type === "TRUCK" ? "Truck" : asset.type === "EQUIPMENT" ? "Equipment" : "Material";
              const initials = asset.title.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

              return (
                <div key={asset.id} className="rounded-lg border border-neutral-200 bg-white">
                  <Link href={`/listings/${asset.id}`}>
                    <div className="flex h-40 items-center justify-center bg-neutral-100">
                      <span className="font-heading text-2xl font-bold text-neutral-300">{initials}</span>
                    </div>
                  </Link>
                  <div className="p-4">
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {typeLabel}
                    </span>
                    <Link href={`/listings/${asset.id}`}>
                      <h3 className="mt-2 font-heading text-base font-bold text-neutral-900 hover:text-accent">{asset.title}</h3>
                    </Link>
                    <p className="mt-1 font-mono text-lg font-bold text-success">{priceDisplay}</p>
                    <p className="mt-1 text-sm text-neutral-500">{asset.state || asset.location || "Nigeria"}</p>
                    <p className="text-xs text-neutral-400">by {asset.owner.fullName}</p>
                    {session?.user ? (
                      <Link href={`/listings/${asset.id}`} className="btn-primary mt-4 block w-full text-center text-sm">
                        Add to Cart
                      </Link>
                    ) : (
                      <Link href="/auth/login" className="btn-primary mt-4 block w-full text-center text-sm">
                        Sign in to hire
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {assets.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-neutral-400">No assets match your filters. Try adjusting your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
