import { prisma } from "@/lib/prisma";

export async function getAdminDashboard() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalOwners,
    totalClients,
    totalListings,
    pendingListings,
    totalBookings,
    activeBookings,
    pendingBookings,
    totalRevenue,
    pendingWithdrawals,
    openTickets,
    recentLogins,
    revenueByDay,
    bookingsByDay,
    usersByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "OWNER" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.asset.count(),
    prisma.asset.count({ where: { isApproved: false } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "IN_PROGRESS" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.transaction.aggregate({ where: { category: "INCOME" }, _sum: { amount: true } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: { not: "CLOSED" } } }),
    prisma.loginHistory.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.$queryRawUnsafe<{ date: string; sum: number }[]>(
      `SELECT DATE("date") as date, SUM(amount) as sum FROM "Transaction" WHERE category = 'INCOME' AND "date" >= $1 GROUP BY DATE("date") ORDER BY date ASC`,
      thirtyDaysAgo
    ),
    prisma.$queryRawUnsafe<{ date: string; count: number }[]>(
      `SELECT DATE("createdAt") as date, COUNT(*) as count FROM "Booking" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date ASC`,
      thirtyDaysAgo
    ),
    prisma.$queryRawUnsafe<{ date: string; count: number }[]>(
      `SELECT DATE("createdAt") as date, COUNT(*) as count FROM "User" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date ASC`,
      thirtyDaysAgo
    ),
  ]);

  return {
    users: { total: totalUsers, owners: totalOwners, clients: totalClients },
    listings: { total: totalListings, pending: pendingListings },
    bookings: { total: totalBookings, active: activeBookings, pending: pendingBookings },
    revenue: totalRevenue._sum.amount || 0,
    pendingWithdrawals,
    openTickets,
    recentLogins,
    charts: {
      revenueByDay: revenueByDay.map((r) => ({ date: String(r.date).slice(0, 10), value: Number(r.sum) })),
      bookingsByDay: bookingsByDay.map((r) => ({ date: String(r.date).slice(0, 10), count: Number(r.count) })),
      usersByDay: usersByDay.map((r) => ({ date: String(r.date).slice(0, 10), count: Number(r.count) })),
    },
  };
}

export async function getAdminListings(filters?: { type?: string; approved?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.approved === "pending") where.isApproved = false;
  if (filters?.approved === "approved") where.isApproved = true;

  return prisma.asset.findMany({
    where,
    include: { owner: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminUsers(filters?: { role?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.role) where.role = filters.role;
  if (filters?.status) where.status = filters.status;

  return prisma.user.findMany({
    where,
    include: { _count: { select: { assets: true, bookingsAsOwner: true, bookingsAsClient: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminBookings(status?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  return prisma.booking.findMany({
    where,
    include: {
      asset: { select: { id: true, title: true, type: true } },
      client: { select: { id: true, fullName: true, email: true } },
      owner: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminFinancials() {
  const [recentTransactions, pendingWithdrawals] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 50,
      include: { owner: { select: { fullName: true } } },
    }),
    prisma.withdrawal.findMany({
      where: { status: "PENDING" },
      include: { wallet: { include: { user: { select: { fullName: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { recentTransactions, pendingWithdrawals };
}

export async function getAdminAuditLogs() {
  return prisma.auditLog.findMany({
    include: { admin: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
