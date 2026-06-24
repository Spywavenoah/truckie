import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            asset: { select: { id: true, title: true, type: true, pricePerDay: true, pricePerTon: true, unit: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: { items: { include: { asset: { select: { id: true, title: true, type: true, pricePerDay: true, pricePerTon: true, unit: true } } } } },
      });
    }

    const total = cart.items.reduce((sum, item) => sum + item.totalCost, 0);

    return NextResponse.json({ success: true, data: { ...cart, total } });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { assetId, itemType, startDate, endDate, quantity } = await request.json();

    if (!assetId || !itemType) {
      return NextResponse.json({ success: false, error: "Asset ID and item type are required" }, { status: 400 });
    }
    if (!["TRUCK", "MATERIAL"].includes(itemType)) {
      return NextResponse.json({ success: false, error: "Item type must be TRUCK or MATERIAL" }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || !asset.isApproved || asset.availabilityStatus !== "AVAILABLE") {
      return NextResponse.json({ success: false, error: "Asset not available" }, { status: 400 });
    }

    if (itemType === "TRUCK") {
      if (!startDate || !endDate) {
        return NextResponse.json({ success: false, error: "Start and end dates required for truck rental" }, { status: 400 });
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const totalCost = (asset.pricePerDay || 0) * days;

      let cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId: session.user.id } });
      }

      const item = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          assetId,
          itemType: "TRUCK",
          startDate: start,
          endDate: end,
          totalCost,
        },
        include: { asset: { select: { id: true, title: true, type: true, pricePerDay: true } } },
      });

      return NextResponse.json({ success: true, data: item, message: "Added to cart" }, { status: 201 });
    }

    if (itemType === "MATERIAL") {
      if (!quantity || quantity <= 0) {
        return NextResponse.json({ success: false, error: "Valid quantity required for materials" }, { status: 400 });
      }
      const totalCost = (asset.pricePerTon || 0) * quantity;

      let cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId: session.user.id } });
      }

      const item = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          assetId,
          itemType: "MATERIAL",
          quantity,
          totalCost,
        },
        include: { asset: { select: { id: true, title: true, type: true, pricePerTon: true, unit: true } } },
      });

      return NextResponse.json({ success: true, data: item, message: "Added to cart" }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
