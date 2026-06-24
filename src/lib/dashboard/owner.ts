import { prisma } from "@/lib/prisma";

export async function getOwnerOverview(userId: string) {
  const [listings, activeBookings, totalEarnings, pendingRequests] = await Promise.all([
    prisma.asset.count({ where: { ownerId: userId, availabilityStatus: { not: "INACTIVE" } } }),
    prisma.booking.count({ where: { ownerId: userId, status: "IN_PROGRESS" } }),
    prisma.transaction.aggregate({
      where: { ownerId: userId, category: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.booking.count({ where: { ownerId: userId, status: "PENDING" } }),
  ]);

  const recentBookings = await prisma.booking.findMany({
    where: { ownerId: userId },
    include: {
      asset: { select: { id: true, title: true } },
      client: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const lowFuelAssets = await prisma.fuelLog.groupBy({
    by: ["assetId"],
    _sum: { litersIssued: true },
    where: { asset: { ownerId: userId } },
    orderBy: { _sum: { litersIssued: "asc" } },
    take: 5,
  });

  return {
    stats: {
      totalListings: listings,
      activeBookings,
      totalEarnings: totalEarnings._sum.amount || 0,
      pendingRequests,
    },
    recentBookings,
    lowFuelAssets,
  };
}

export async function getOwnerListings(userId: string) {
  return prisma.asset.findMany({
    where: { ownerId: userId },
    include: {
      _count: { select: { bookings: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOwnerBookings(userId: string, status?: string) {
  const where: Record<string, unknown> = { ownerId: userId };
  if (status) where.status = status;

  return prisma.booking.findMany({
    where,
    include: {
      asset: { select: { id: true, title: true, type: true } },
      client: { select: { id: true, fullName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOwnerDrivers(userId: string) {
  return prisma.driver.findMany({
    where: { ownerId: userId },
    include: { _count: { select: { payments: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOwnerFinancials(userId: string) {
  const [income, expense, recentTransactions] = await Promise.all([
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
    prisma.transaction.findMany({
      where: { ownerId: userId },
      orderBy: { date: "desc" },
      take: 20,
      include: { asset: { select: { title: true } }, booking: { select: { id: true } } },
    }),
  ]);

  return {
    totalIncome: income._sum.amount || 0,
    totalExpenses: expense._sum.amount || 0,
    netProfit: (income._sum.amount || 0) - (expense._sum.amount || 0),
    incomeCount: income._count,
    expenseCount: expense._count,
    recentTransactions,
  };
}

export async function getOwnerWallet(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 }, withdrawals: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  return wallet;
}
