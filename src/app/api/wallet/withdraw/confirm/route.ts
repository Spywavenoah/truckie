import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!rateLimit(`withdraw-confirm:${session.user.id}`, 5, 900000)) {
      return NextResponse.json({ success: false, error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { withdrawalId, otpCode, transferPin } = await request.json();

    if (!withdrawalId || !otpCode || !transferPin) {
      return NextResponse.json({ success: false, error: "Withdrawal ID, OTP, and PIN are required" }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { wallet: { select: { userId: true, id: true, balance: true } } },
    });

    if (!withdrawal || withdrawal.wallet.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 });
    }

    if (withdrawal.status !== "PENDING_OTP") {
      return NextResponse.json({ success: false, error: "Invalid withdrawal status" }, { status: 400 });
    }

    if (withdrawal.otpCode !== otpCode || !withdrawal.otpExp || new Date() > withdrawal.otpExp) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.transferPin) {
      return NextResponse.json({ success: false, error: "No transfer PIN set" }, { status: 400 });
    }

    const pinValid = await bcrypt.compare(transferPin, user.transferPin);
    if (!pinValid) {
      return NextResponse.json({ success: false, error: "Invalid transfer PIN" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: withdrawal.walletId } });
      if (!wallet || wallet.balance < withdrawal.amount) {
        throw new Error("Insufficient balance");
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: withdrawal.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: withdrawal.amount,
          description: `Withdrawal to ${withdrawal.accountName} (${withdrawal.destinationBank})`,
          reference: withdrawal.reference || undefined,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance - withdrawal.amount,
        },
      });

      await tx.transaction.create({
        data: {
          ownerId: session.user.id,
          category: "EXPENSE",
          amount: withdrawal.amount,
          description: `Withdrawal to ${withdrawal.accountName} (${withdrawal.destinationBank})`,
          reference: withdrawal.reference || generateReference("WTH"),
        },
      });

      return tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: "PENDING", otpVerified: true, otpCode: null, otpExp: null },
      });
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Withdrawal confirmed and submitted for processing",
    }, { status: 200 });
  } catch (error) {
    console.error("Confirm withdrawal error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
