import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { userId, amount, type, reason } = await request.json();

    if (!userId || !amount || amount <= 0 || !type || !["CREDIT", "DEBIT"].includes(type)) {
      return NextResponse.json({ success: false, error: "userId, amount (>0), and type (CREDIT/DEBIT) required" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return NextResponse.json({ success: false, error: "User wallet not found" }, { status: 404 });
    }

    const adjustment = type === "CREDIT" ? amount : -amount;
    const newBalance = wallet.balance + adjustment;

    if (newBalance < 0) {
      return NextResponse.json({ success: false, error: "Insufficient balance for debit" }, { status: 400 });
    }

    const [updated] = await prisma.$transaction([
      prisma.wallet.update({ where: { userId }, data: { balance: newBalance } }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount,
          description: reason || `Admin ${type.toLowerCase()} adjustment`,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
        },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: `WALLET_${type}`,
        resource: "Wallet",
        resourceId: wallet.id,
        detail: `${type} of ${amount} to user ${userId}${reason ? `: ${reason}` : ""}`,
      },
    });

    return NextResponse.json({ success: true, data: updated, message: `Wallet ${type.toLowerCase()}ed by ${amount}` });
  } catch (error) {
    console.error("Wallet adjustment error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
