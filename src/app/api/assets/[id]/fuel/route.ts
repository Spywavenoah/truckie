import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.fuelLog.findMany({
      where: { assetId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: logs }, { status: 200 });
  } catch (error) {
    console.error("Get fuel logs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch fuel logs" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }
    if (asset.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "You do not own this asset" }, { status: 403 });
    }

    const body = await request.json();
    const log = await prisma.fuelLog.create({
      data: {
        assetId: id,
        date: body.date ? new Date(body.date) : new Date(),
        litersIssued: body.litersIssued ? parseFloat(body.litersIssued) : null,
        costPerLiter: body.costPerLiter ? parseFloat(body.costPerLiter) : null,
        totalCost: body.totalCost ? parseFloat(body.totalCost) : null,
        odometerReading: body.odometerReading ? parseFloat(body.odometerReading) : null,
        fuelStation: body.fuelStation || null,
        attendant: body.attendant || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    console.error("Create fuel log error:", error);
    return NextResponse.json({ success: false, error: "Failed to create fuel log" }, { status: 500 });
  }
}
