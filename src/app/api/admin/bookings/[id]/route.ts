import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        asset: {
          select: { id: true, title: true, type: true, plateNumber: true },
        },
        client: { select: { id: true, fullName: true, email: true, phone: true } },
        owner: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: booking }, { status: 200 });
  } catch (error) {
    console.error("Admin get booking error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, ownerNote, clientNote } = await request.json();

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (ownerNote !== undefined) updateData.ownerNote = ownerNote;
    if (clientNote !== undefined) updateData.clientNote = clientNote;

    const updated = await prisma.booking.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "BOOKING_OVERRIDE",
        resource: "Booking",
        resourceId: id,
        detail: `Booking ${id} updated by admin: ${JSON.stringify(updateData)}`,
      },
    });

    return NextResponse.json({ success: true, data: updated, message: "Booking updated" });
  } catch (error) {
    console.error("Booking override error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
