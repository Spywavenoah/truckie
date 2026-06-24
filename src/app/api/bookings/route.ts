import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validations";
import { generateReference } from "@/lib/utils";
import { notifyUser } from "@/lib/notifications";
import { bookingNotificationHtml } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const status = searchParams.get("status");

    const role = session.user.role;

    const where: Record<string, unknown> = {};
    if (role === "OWNER") {
      where.ownerId = session.user.id;
    } else if (role === "CLIENT") {
      where.clientId = session.user.id;
    } else if (role === "ADMIN") {
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 403 }
      );
    }
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          asset: { select: { id: true, title: true, type: true } },
          client: { select: { id: true, fullName: true, email: true } },
          owner: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("List bookings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { success: false, error: "Only clients can create bookings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createBookingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { assetId, startDate, endDate, purpose, pickupLocation, dropoffLocation, clientNote } =
      validated.data;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }
    if (asset.availabilityStatus !== "AVAILABLE") {
      return NextResponse.json(
        { success: false, error: "Asset is not available" },
        { status: 409 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalCost = (asset.pricePerDay || 0) * days;

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet || wallet.balance < totalCost) {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    const settings = await prisma.platformSettings.findFirst();
    const platformFeePercent = settings?.platformFee ?? 3.0;
    const feeAmount = Math.ceil(totalCost * platformFeePercent / 100);
    const netAmount = totalCost - feeAmount;

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          assetId,
          clientId: session.user.id,
          ownerId: asset.ownerId,
          startDate: start,
          endDate: end,
          totalCost,
          purpose,
          pickupLocation,
          dropoffLocation,
          clientNote,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalCost } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: totalCost,
          description: `Booking hold for ${asset.title}`,
          reference: generateReference("HOLD"),
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance - totalCost,
          bookingId: b.id,
          metadata: { bookingIds: [b.id] },
        },
      });

      await tx.transaction.create({
        data: {
          ownerId: asset.ownerId,
          bookingId: b.id,
          category: "INCOME",
          subCategory: "BOOKING",
          description: `Rental income: ${asset.title}`,
          amount: netAmount,
          assetId,
          reference: generateReference("INC"),
        },
      });

      await tx.transaction.create({
        data: {
          ownerId: asset.ownerId,
          bookingId: b.id,
          category: "FEE",
          subCategory: "PLATFORM_FEE",
          description: `Platform fee for booking ${asset.title}`,
          amount: feeAmount,
          assetId,
          reference: generateReference("FEE"),
        },
      });

      const ownerWallet = await tx.wallet.findUnique({
        where: { userId: asset.ownerId },
      });

      await tx.escrowTransaction.create({
        data: {
          bookingId: b.id,
          fromWalletId: wallet.id,
          toWalletId: ownerWallet?.id || "",
          amount: totalCost,
          status: "HELD",
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { availabilityStatus: "HIRED" },
      });

      return b;
    });

    const ownerUser = await prisma.user.findUnique({ where: { id: asset.ownerId } });
    if (ownerUser) {
      notifyUser({
        userId: ownerUser.id,
        title: "New Booking Request",
        message: `${session.user.name} requested to book ${asset.title} for ₦${totalCost.toLocaleString()}`,
        type: "BOOKING",
        link: `/dashboard/owner/bookings/${booking.id}`,
        email: {
          to: ownerUser.email,
          subject: "New Booking Request",
          html: bookingNotificationHtml({
            recipientName: ownerUser.fullName,
            action: `${session.user.name} requested to book your ${asset.title}`,
            assetTitle: asset.title,
            bookingId: booking.id,
            dashboardUrl: `${process.env.APP_URL || "http://localhost:3000"}/dashboard/owner/bookings/${booking.id}`,
          }),
        },
      });
    }

    return NextResponse.json(
      { success: true, data: booking, message: "Booking created. Funds held in escrow." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
