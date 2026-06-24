import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        owner: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: asset }, { status: 200 });
  } catch (error) {
    console.error("Get asset error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const asset = await prisma.asset.findUnique({ where: { id } });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    if (asset.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only the owner can update this asset" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "title", "description", "category", "make", "model", "year",
      "plateNumber", "capacity", "unit", "pricePerDay", "pricePerHour",
      "pricePerTon", "location", "state", "lga", "availabilityStatus",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: { images: true },
    });

    return NextResponse.json(
      { success: true, data: updated, message: "Asset updated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update asset error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const asset = await prisma.asset.findUnique({ where: { id } });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    if (asset.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only the owner can delete this asset" },
        { status: 403 }
      );
    }

    await prisma.asset.update({
      where: { id },
      data: { availabilityStatus: "INACTIVE" },
    });

    return NextResponse.json(
      { success: true, message: "Asset deactivated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete asset error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
