import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const where = session.user.role === "ADMIN"
      ? {}
      : { OR: [{ clientId: session.user.id }, { ownerId: session.user.id }] };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        asset: { select: { title: true } },
        client: { select: { fullName: true, email: true } },
        owner: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const header = "Booking ID,Asset,Client,Owner,Start Date,End Date,Total Cost,Status,Created At\n";
    const rows = bookings.map((b) =>
      [
        b.id,
        `"${b.asset.title.replace(/"/g, '""')}"`,
        `"${b.client.fullName.replace(/"/g, '""')}"`,
        `"${b.owner.fullName.replace(/"/g, '""')}"`,
        b.startDate.toISOString().split("T")[0],
        b.endDate.toISOString().split("T")[0],
        b.totalCost,
        b.status,
        b.createdAt.toISOString(),
      ].join(",")
    ).join("\n");

    const csv = header + rows;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="bookings-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Booking export error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
