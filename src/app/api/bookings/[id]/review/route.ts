import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { rating, comment } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, clientId: true, ownerId: true, assetId: true, status: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (session.user.id !== booking.clientId) {
      return NextResponse.json({ success: false, error: "Only the client can review a booking" }, { status: 403 });
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json({ success: false, error: "Only completed bookings can be reviewed" }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { bookingId_reviewerId: { bookingId: id, reviewerId: session.user.id } } });
    if (existing) {
      return NextResponse.json({ success: false, error: "You have already reviewed this booking" }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        bookingId: id,
        reviewerId: session.user.id,
        revieweeId: booking.ownerId,
        assetId: booking.assetId,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, data: review, message: "Review submitted" }, { status: 201 });
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
