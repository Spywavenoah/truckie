import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { notifyUser } from "@/lib/notifications";
import { bookingNotificationHtml } from "@/lib/email";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { asset: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
    }

    const total = cart.items.reduce((sum, item) => sum + item.totalCost, 0);

    const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
    if (!wallet || wallet.balance < total) {
      return NextResponse.json({ success: false, error: `Insufficient balance. Need ₦${total.toLocaleString()}` }, { status: 400 });
    }

    const settings = await prisma.platformSettings.findFirst();
    const platformFeePercent = settings?.platformFee ?? 3.0;

    const results = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: total } },
      });

      const createdBookings: Array<{ id: string; assetId: string; ownerId: string }> = [];
      let totalFees = 0;

      for (const item of cart.items) {
        const ownerWallet = await tx.wallet.findUnique({ where: { userId: item.asset.ownerId } });

        const feeAmount = Math.ceil(item.totalCost * platformFeePercent / 100);
        const netAmount = item.totalCost - feeAmount;
        totalFees += feeAmount;

        if (item.itemType === "TRUCK") {
          const booking = await tx.booking.create({
            data: {
              assetId: item.assetId,
              clientId: session.user.id,
              ownerId: item.asset.ownerId,
              startDate: item.startDate!,
              endDate: item.endDate!,
              totalCost: item.totalCost,
              status: "PENDING",
            },
          });

          await tx.escrowTransaction.create({
            data: {
              bookingId: booking.id,
              fromWalletId: wallet.id,
              toWalletId: ownerWallet?.id || "",
              amount: netAmount,
              status: "HELD",
            },
          });

          await tx.asset.update({
            where: { id: item.assetId },
            data: { availabilityStatus: "HIRED" },
          });

          await tx.transaction.create({
            data: {
              ownerId: item.asset.ownerId,
              bookingId: booking.id,
              category: "FEE",
              subCategory: "PLATFORM_FEE",
              description: `Platform fee for booking ${item.asset.title}`,
              amount: feeAmount,
              assetId: item.assetId,
              reference: generateReference("FEE"),
            },
          });

          await tx.transaction.create({
            data: {
              ownerId: item.asset.ownerId,
              bookingId: booking.id,
              category: "INCOME",
              subCategory: "BOOKING",
              description: `Rental income: ${item.asset.title}`,
              amount: netAmount,
              assetId: item.assetId,
              reference: generateReference("INC"),
            },
          });

          createdBookings.push({ id: booking.id, assetId: item.assetId, ownerId: item.asset.ownerId });
        }

        if (item.itemType === "MATERIAL") {
          const now = new Date();
          const booking = await tx.booking.create({
            data: {
              assetId: item.assetId,
              clientId: session.user.id,
              ownerId: item.asset.ownerId,
              startDate: now,
              endDate: now,
              totalCost: item.totalCost,
              status: "COMPLETED",
            },
          });

          if (ownerWallet) {
            await tx.wallet.update({
              where: { id: ownerWallet.id },
              data: { balance: { increment: netAmount } },
            });
            await tx.walletTransaction.create({
              data: {
                walletId: ownerWallet.id,
                type: "CREDIT",
                amount: netAmount,
                description: `Material sale: ${item.asset.title} x${item.quantity} (net after fee)`,
                reference: generateReference("MAT"),
                balanceBefore: ownerWallet.balance,
                balanceAfter: ownerWallet.balance + netAmount,
                bookingId: booking.id,
              },
            });
          }

          await tx.transaction.create({
            data: {
              ownerId: item.asset.ownerId,
              bookingId: booking.id,
              category: "INCOME",
              subCategory: "MATERIAL_SALE",
              description: `Material purchase: ${item.asset.title} x${item.quantity}`,
              amount: netAmount,
              assetId: item.assetId,
              reference: generateReference("MAT"),
            },
          });

          await tx.transaction.create({
            data: {
              ownerId: item.asset.ownerId,
              bookingId: booking.id,
              category: "FEE",
              subCategory: "PLATFORM_FEE",
              description: `Platform fee for material sale ${item.asset.title}`,
              amount: feeAmount,
              assetId: item.assetId,
              reference: generateReference("FEE"),
            },
          });

          createdBookings.push({ id: booking.id, assetId: item.assetId, ownerId: item.asset.ownerId });
        }
      }

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: total,
          description: `Cart checkout — ${cart.items.length} item(s)`,
          reference: generateReference("CART"),
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance - total,
          metadata: { bookingIds: createdBookings.map((b) => b.id) },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return { createdBookings, total, totalFees };
    });

    for (const booking of results.createdBookings) {
      const ownerUser = await prisma.user.findUnique({ where: { id: booking.ownerId } });
      const asset = await prisma.asset.findUnique({ where: { id: booking.assetId } });
      if (ownerUser && asset) {
        notifyUser({
          userId: ownerUser.id,
          title: "New Booking Request",
          message: `New booking from cart checkout for ${asset.title}`,
          type: "BOOKING",
          link: `/dashboard/owner/bookings/${booking.id}`,
          email: {
            to: ownerUser.email,
            subject: "New Booking from Cart Checkout",
            html: bookingNotificationHtml({
              recipientName: ownerUser.fullName,
              action: `${session.user.name} booked your ${asset.title} via cart checkout`,
              assetTitle: asset.title,
              bookingId: booking.id,
              dashboardUrl: `${process.env.APP_URL || "http://localhost:3000"}/dashboard/owner/bookings/${booking.id}`,
            }),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { bookings: results.createdBookings, total: results.total, fees: results.totalFees },
      message: `Checkout successful. ₦${results.total.toLocaleString()} paid (₦${results.totalFees.toLocaleString()} platform fee).`,
    }, { status: 200 });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
