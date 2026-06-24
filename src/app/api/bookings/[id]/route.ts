import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { notifyUser } from "@/lib/notifications";
import { bookingNotificationHtml } from "@/lib/email";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        asset: {
          select: { id: true, title: true, type: true, plateNumber: true, pricePerDay: true },
        },
        client: { select: { id: true, fullName: true, email: true, phone: true } },
        owner: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const role = session.user.role;
    if (role === "OWNER" && booking.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You do not own this booking" },
        { status: 403 }
      );
    }
    if (role === "CLIENT" && booking.clientId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "This is not your booking" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: booking }, { status: 200 });
  } catch (error) {
    console.error("Get booking error:", error);
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

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const role = session.user.role;
    const validTransitions: Record<string, Record<string, string[]>> = {
      OWNER: {
        PENDING: ["ACCEPTED", "REJECTED"],
        ACCEPTED: ["IN_PROGRESS"],
        IN_PROGRESS: ["COMPLETED"],
      },
      CLIENT: {
        PENDING: ["CANCELLED"],
        ACCEPTED: ["CANCELLED"],
      },
    };

    const allowed = (validTransitions[role]?.[booking.status] ?? []).includes(newStatus);

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${booking.status} to ${newStatus}` },
        { status: 403 }
      );
    }

    if (role === "OWNER" && booking.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You do not own this booking" },
        { status: 403 }
      );
    }

    if (role === "CLIENT" && booking.clientId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "This is not your booking" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "CANCELLED") {
      updateData.cancelledAt = new Date();
    }
    if (newStatus === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const updated = await prisma.$transaction(async (tx) => {
      if (newStatus === "COMPLETED") {
        const escrow = await tx.escrowTransaction.findFirst({
          where: { bookingId: id, status: "HELD" },
        });

        if (escrow) {
          const ownerWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: booking.ownerId } });
          await tx.wallet.update({
            where: { userId: booking.ownerId },
            data: { balance: { increment: escrow.amount } },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: ownerWallet.id,
              type: "CREDIT",
              amount: escrow.amount,
              description: `Booking #${id.substring(0, 8)} completed — escrow released`,
              reference: generateReference("REL"),
              balanceBefore: ownerWallet.balance,
              balanceAfter: ownerWallet.balance + escrow.amount,
            },
          });
          await tx.escrowTransaction.update({
            where: { id: escrow.id },
            data: { status: "RELEASED", releasedAt: new Date() },
          });
          await tx.transaction.create({
            data: {
              ownerId: booking.ownerId,
              category: "INCOME",
              subCategory: "ESCROW_RELEASE",
              description: `Escrow release for booking on ${booking.asset?.title || "asset"}`,
              amount: escrow.amount,
              bookingId: id,
              assetId: booking.assetId,
              reference: generateReference("INC"),
            },
          });
        }
        await tx.asset.update({
          where: { id: booking.assetId },
          data: { availabilityStatus: "AVAILABLE" },
        });
      }

      if (newStatus === "CANCELLED" || newStatus === "REJECTED") {
        const escrow = await tx.escrowTransaction.findFirst({
          where: { bookingId: id, status: "HELD" },
        });

        if (escrow) {
          const clientWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: booking.clientId } });
          await tx.wallet.update({
            where: { userId: booking.clientId },
            data: { balance: { increment: escrow.amount } },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: clientWallet.id,
              type: "CREDIT",
              amount: escrow.amount,
              description: `Booking #${id.substring(0, 8)} ${newStatus.toLowerCase()} — escrow refunded`,
              reference: generateReference("REF"),
              balanceBefore: clientWallet.balance,
              balanceAfter: clientWallet.balance + escrow.amount,
            },
          });
          await tx.escrowTransaction.update({
            where: { id: escrow.id },
            data: { status: "REFUNDED", releasedAt: new Date() },
          });
        }
        await tx.asset.update({
          where: { id: booking.assetId },
          data: { availabilityStatus: "AVAILABLE" },
        });
      }

      return tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          asset: {
            select: { id: true, title: true, type: true, plateNumber: true, pricePerDay: true },
          },
          client: { select: { id: true, fullName: true, email: true, phone: true } },
          owner: { select: { id: true, fullName: true, email: true, phone: true } },
        },
      });
    });

    const assetTitle = updated.asset?.title || "Asset";
    const clientName = updated.client?.fullName || "Client";
    const ownerName = updated.owner?.fullName || "Owner";

    const notificationMap: Record<string, { userId: string; title: string; message: string; link: string; emailTo: string; emailSubject: string; emailAction: string }[]> = {
      ACCEPTED: [
        {
          userId: booking.clientId,
          title: "Booking Accepted",
          message: `Your booking for ${assetTitle} has been accepted by the owner.`,
          link: `/dashboard/client/bookings/${id}`,
          emailTo: updated.client?.email || "",
          emailSubject: "Booking Accepted",
          emailAction: "Your booking has been accepted and is now in progress.",
        },
      ],
      REJECTED: [
        {
          userId: booking.clientId,
          title: "Booking Rejected",
          message: `Your booking for ${assetTitle} has been rejected. Funds have been refunded.`,
          link: `/dashboard/client/bookings/${id}`,
          emailTo: updated.client?.email || "",
          emailSubject: "Booking Rejected",
          emailAction: "Your booking has been rejected. Your funds have been refunded to your wallet.",
        },
      ],
      IN_PROGRESS: [
        {
          userId: booking.clientId,
          title: "Booking In Progress",
          message: `Your rental of ${assetTitle} is now in progress.`,
          link: `/dashboard/client/bookings/${id}`,
          emailTo: updated.client?.email || "",
          emailSubject: "Booking In Progress",
          emailAction: "Your rental is now active.",
        },
      ],
      COMPLETED: [
        {
          userId: booking.clientId,
          title: "Booking Completed",
          message: `Your booking for ${assetTitle} has been marked complete.`,
          link: `/dashboard/client/bookings/${id}`,
          emailTo: updated.client?.email || "",
          emailSubject: "Booking Completed",
          emailAction: "Your booking has been completed. Thank you!",
        },
      ],
      CANCELLED: [
        {
          userId: booking.ownerId,
          title: "Booking Cancelled",
          message: `${clientName} cancelled the booking for ${assetTitle}.`,
          link: `/dashboard/owner/bookings/${id}`,
          emailTo: updated.owner?.email || "",
          emailSubject: "Booking Cancelled",
          emailAction: `${clientName} has cancelled the booking.`,
        },
      ],
    };

    const notifications = notificationMap[newStatus] || [];
    for (const n of notifications) {
      notifyUser({
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: "BOOKING",
        link: n.link,
        email: n.emailTo ? {
          to: n.emailTo,
          subject: n.emailSubject,
          html: bookingNotificationHtml({
            recipientName: n.userId === booking.clientId ? clientName : ownerName,
            action: n.emailAction,
            assetTitle,
            bookingId: id,
            dashboardUrl: `${appUrl}${n.link}`,
          }),
        } : undefined,
      });
    }

    return NextResponse.json(
      { success: true, data: updated, message: `Booking ${newStatus.toLowerCase()}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
