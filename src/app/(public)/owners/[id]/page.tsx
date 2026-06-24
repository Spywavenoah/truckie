import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function OwnerStorefrontPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const owner = await prisma.user.findUnique({
    where: { id },
    select: { id: true, fullName: true, email: true, phone: true, createdAt: true, _count: { select: { assets: true } } },
  });

  if (!owner) notFound();

  const listings = await prisma.asset.findMany({
    where: { ownerId: id, isApproved: true, availabilityStatus: { not: "INACTIVE" } },
    include: { images: { where: { isPrimary: true }, take: 1, select: { url: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">{owner.fullName}</h1>
        <p className="mt-1 text-sm text-neutral-500">{owner.email}{owner.phone ? ` · ${owner.phone}` : ""}</p>
        <p className="text-xs text-neutral-400 mt-0.5">Member since {new Date(owner.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long" })} · {owner._count.assets} listing{owner._count.assets !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((asset) => (
          <Link key={asset.id} href={`/listings/${asset.id}`} className="group block">
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="aspect-video bg-neutral-100">
                {asset.images[0] ? (
                  <img src={asset.images[0].url} alt={asset.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-300 text-4xl font-bold">{asset.title.charAt(0)}</div>
                )}
              </div>
              <CardContent className="p-4">
                <Badge variant="outline" className="mb-2">{asset.type}</Badge>
                <h3 className="font-semibold text-neutral-900 group-hover:text-accent transition-colors">{asset.title}</h3>
                <p className="mt-1 text-sm font-mono text-accent">&#x20A6;{(asset.pricePerDay || asset.pricePerHour || asset.pricePerTon || 0).toLocaleString()}{asset.pricePerDay ? "/day" : asset.pricePerHour ? "/hr" : "/ton"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {listings.length === 0 && (
        <p className="py-16 text-center text-sm text-neutral-400">No active listings from this owner.</p>
      )}
    </div>
  );
}
