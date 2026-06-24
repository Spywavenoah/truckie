import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusOrder = ["PENDING", "PROCESSED", "REJECTED", "FAILED"] as const;

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json({ success: false, error: "Wallet not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = { walletId: wallet.id };
    if (statusFilter !== "all") {
      where.status = statusFilter.toUpperCase();
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const counts: Record<string, number> = { all: withdrawals.length };
    for (const s of statusOrder) {
      counts[s.toLowerCase()] = await prisma.withdrawal.count({
        where: { walletId: wallet.id, status: s },
      });
    }

    return NextResponse.json({ success: true, data: withdrawals, counts }, { status: 200 });
  } catch (error) {
    console.error("List withdrawals error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
