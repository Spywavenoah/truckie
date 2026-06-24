import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const [income, expense, fees, recentTransactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ownerId: userId, category: "INCOME" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ownerId: userId, category: "EXPENSE" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ownerId: userId, category: "FEE" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.findMany({
        where: { ownerId: userId },
        orderBy: { date: "desc" },
        take: 20,
        include: { asset: { select: { title: true } }, booking: { select: { id: true } } },
      }),
    ]);

    const totalExpenses = (expense._sum.amount || 0) + (fees._sum.amount || 0);

    return NextResponse.json({
      success: true,
      data: {
        totalIncome: income._sum.amount || 0,
        totalExpenses,
        netProfit: (income._sum.amount || 0) - totalExpenses,
        incomeCount: income._count,
        expenseCount: expense._count + fees._count,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error("Owner financials error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
