import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: { asset: { select: { id: true, title: true, type: true, pricePerDay: true, pricePerHour: true, pricePerTon: true, state: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Wishlist GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { assetId } = await request.json();
    if (!assetId) return NextResponse.json({ success: false, error: "assetId required" }, { status: 400 });

    const existing = await prisma.wishlistItem.findUnique({ where: { userId_assetId: { userId: session.user.id, assetId } } });
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, saved: false, message: "Removed from saved" });
    }

    await prisma.wishlistItem.create({ data: { userId: session.user.id, assetId } });
    return NextResponse.json({ success: true, saved: true, message: "Saved!" });
  } catch (error) {
    console.error("Wishlist POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
