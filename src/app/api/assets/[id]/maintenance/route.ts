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

    const logs = await prisma.maintenanceLog.findMany({
      where: { assetId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: logs }, { status: 200 });
  } catch (error) {
    console.error("Get maintenance logs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch maintenance logs" }, { status: 500 });
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
    const log = await prisma.maintenanceLog.create({
      data: {
        assetId: id,
        maintenanceType: body.maintenanceType,
        description: body.description || null,
        cost: body.cost ? parseFloat(body.cost) : null,
        vendorName: body.vendorName || null,
        vendorPhone: body.vendorPhone || null,
        odometerReading: body.odometerReading ? parseFloat(body.odometerReading) : null,
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        nextDueOdometer: body.nextDueOdometer ? parseFloat(body.nextDueOdometer) : null,
        performedBy: body.performedBy || null,
      },
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    console.error("Create maintenance log error:", error);
    return NextResponse.json({ success: false, error: "Failed to create maintenance log" }, { status: 500 });
  }
}
