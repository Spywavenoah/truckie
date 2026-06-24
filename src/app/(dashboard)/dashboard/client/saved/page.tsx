import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SavedListingsPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500">Sign in to view your saved listings.</p>
        <Link href="/auth/login" className="btn-primary mt-4 inline-block">Sign in</Link>
      </div>
    );
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      asset: {
        select: {
          id: true, title: true, type: true, pricePerDay: true, pricePerHour: true, pricePerTon: true, state: true, isApproved: true, availabilityStatus: true,
          owner: { select: { fullName: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeItems = items.filter((i) => i.asset.isApproved && i.asset.availabilityStatus !== "INACTIVE");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Saved Listings</h1>
        <p className="mt-1 text-sm text-neutral-500">{activeItems.length} saved listing{activeItems.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeItems.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <Heart className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-400">No saved listings yet. Browse the marketplace and save listings you like.</p>
            <Link href="/dashboard/client/browse" className="btn-primary mt-4 inline-block">Browse Listings</Link>
          </div>
        )}
        {activeItems.map((item) => (
          <Link key={item.id} href={`/listings/${item.asset.id}`} className="group block">
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="aspect-video bg-neutral-100">
                {item.asset.images[0] ? (
                  <img src={item.asset.images[0].url} alt={item.asset.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-300 text-4xl font-bold">{item.asset.title.charAt(0)}</div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="mb-2">{item.asset.type}</Badge>
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </div>
                <h3 className="font-semibold text-neutral-900 group-hover:text-accent transition-colors">{item.asset.title}</h3>
                <p className="mt-0.5 text-xs text-neutral-400">{item.asset.owner.fullName}{item.asset.state ? ` · ${item.asset.state}` : ""}</p>
                <p className="mt-1 text-sm font-mono text-accent">&#x20A6;{(item.asset.pricePerDay || item.asset.pricePerHour || item.asset.pricePerTon || 0).toLocaleString()}{item.asset.pricePerDay ? "/day" : item.asset.pricePerHour ? "/hr" : "/ton"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
