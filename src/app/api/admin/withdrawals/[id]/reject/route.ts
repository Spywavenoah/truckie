import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!withdrawal) {
      return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 });
    }
    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ success: false, error: "Withdrawal is not in PENDING status" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: withdrawal.walletId } });
      if (!wallet) throw new Error("Wallet not found");

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: withdrawal.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: withdrawal.amount,
          description: `Withdrawal reversed — admin rejected`,
          reference: generateReference("REV"),
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance + withdrawal.amount,
        },
      });

      await tx.withdrawal.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "WITHDRAWAL_REJECTED",
          resource: "Withdrawal",
          resourceId: id,
          detail: `Rejected withdrawal of ₦${withdrawal.amount.toLocaleString()} to ${withdrawal.accountName}`,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Withdrawal rejected and funds reversed" }, { status: 200 });
  } catch (error) {
    console.error("Admin reject withdrawal error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
