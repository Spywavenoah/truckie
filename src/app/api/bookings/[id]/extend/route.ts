import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { newEndDate } = await request.json();

    if (!newEndDate) {
      return NextResponse.json({ success: false, error: "newEndDate is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    if (booking.clientId !== session.user.id && booking.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const extendableStatuses = ["ACCEPTED", "IN_PROGRESS"];
    if (!extendableStatuses.includes(booking.status)) {
      return NextResponse.json({ success: false, error: "Booking cannot be extended in its current status" }, { status: 400 });
    }

    const parsedDate = new Date(newEndDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid date" }, { status: 400 });
    }
    if (parsedDate <= booking.endDate) {
      return NextResponse.json({ success: false, error: "New end date must be after the current end date" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { endDate: parsedDate },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Booking extend error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
