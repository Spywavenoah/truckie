import { prisma } from "@/lib/prisma";

export async function getClientOverview(userId: string) {
  const [activeBookings, completedBookings, totalSpent, wallet] = await Promise.all([
    prisma.booking.count({ where: { clientId: userId, status: "IN_PROGRESS" } }),
    prisma.booking.count({ where: { clientId: userId, status: "COMPLETED" } }),
    prisma.booking.aggregate({
      where: { clientId: userId, status: "COMPLETED" },
      _sum: { totalCost: true },
    }),
    prisma.wallet.findUnique({ where: { userId } }),
  ]);

  const recentBookings = await prisma.booking.findMany({
    where: { clientId: userId },
    include: {
      asset: { select: { id: true, title: true, type: true } },
      owner: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    stats: {
      activeBookings,
      completedBookings,
      totalSpent: totalSpent._sum.totalCost || 0,
      walletBalance: wallet?.balance || 0,
    },
    recentBookings,
  };
}

export async function getClientBookings(userId: string, status?: string) {
  const where: Record<string, unknown> = { clientId: userId };
  if (status) where.status = status;

  return prisma.booking.findMany({
    where,
    include: {
      asset: { select: { id: true, title: true, type: true, plateNumber: true } },
      owner: { select: { id: true, fullName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClientWallet(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  return wallet;
}

export async function getClientFinancials(userId: string) {
  const [completedBookings, walletTransactions] = await Promise.all([
    prisma.booking.aggregate({
      where: { clientId: userId, status: "COMPLETED" },
      _sum: { totalCost: true },
      _count: true,
    }),
    prisma.walletTransaction.findMany({
      where: { wallet: { userId }, type: "DEBIT" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const totalSpent = completedBookings._sum.totalCost || 0;
  const totalDebits = walletTransactions.reduce((s, t) => s + t.amount, 0);

  return {
    totalSpent,
    totalWalletDebits: totalDebits,
    walletBalance: wallet?.balance || 0,
    completedCount: completedBookings._count,
    recentTransactions: walletTransactions,
  };
}

export async function getBrowseListings() {
  return prisma.asset.findMany({
    where: { isApproved: true, availabilityStatus: "AVAILABLE" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      owner: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
