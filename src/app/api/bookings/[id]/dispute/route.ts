import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { notifyUser } from "@/lib/notifications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { reason } = await _request.json();

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ success: false, error: "Please provide a detailed reason (min 10 characters)" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { asset: { select: { title: true } }, client: { select: { id: true, fullName: true } }, owner: { select: { id: true, fullName: true } } },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (session.user.id !== booking.clientId && session.user.id !== booking.ownerId) {
      return NextResponse.json({ success: false, error: "You are not part of this booking" }, { status: 403 });
    }

    if (booking.status !== "IN_PROGRESS" && booking.status !== "COMPLETED") {
      return NextResponse.json({ success: false, error: "Only in-progress or completed bookings can be disputed" }, { status: 400 });
    }

    const existing = await prisma.reversalRequest.findFirst({ where: { bookingId: id, status: { in: ["PENDING", "UNDER_REVIEW"] } } });
    if (existing) {
      return NextResponse.json({ success: false, error: "A dispute for this booking is already pending" }, { status: 409 });
    }

    const reversal = await prisma.reversalRequest.create({
      data: {
        requesterId: session.user.id,
        bookingId: id,
        reason: reason.trim(),
        amount: booking.totalCost,
      },
    });

    await prisma.booking.update({ where: { id }, data: { status: "DISPUTED" } });

    await notifyUser({
      userId: booking.ownerId,
      title: "Dispute filed",
      message: `A dispute has been filed for booking on "${booking.asset.title}"`,
      type: "warning",
      link: `/dashboard/owner/bookings/${id}`,
    });

    return NextResponse.json({ success: true, data: reversal, message: "Dispute filed successfully" }, { status: 201 });
  } catch (error) {
    console.error("Dispute creation error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
