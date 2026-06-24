import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalOwners,
      totalClients,
      totalAssets,
      pendingAssets,
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      totalRevenueResult,
      totalTickets,
      openTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "OWNER" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.asset.count(),
      prisma.asset.count({ where: { isApproved: false } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "IN_PROGRESS" } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.walletTransaction.aggregate({
        where: { type: "CREDIT" },
        _sum: { amount: true },
      }),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          users: {
            total: totalUsers,
            owners: totalOwners,
            clients: totalClients,
          },
          assets: {
            total: totalAssets,
            pendingApproval: pendingAssets,
          },
          bookings: {
            total: totalBookings,
            pending: pendingBookings,
            active: activeBookings,
            completed: completedBookings,
          },
          revenue: totalRevenueResult._sum.amount || 0,
          support: {
            total: totalTickets,
            open: openTickets,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
