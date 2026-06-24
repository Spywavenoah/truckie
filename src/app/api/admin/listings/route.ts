import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const type = searchParams.get("type");
    const isApproved = searchParams.get("isApproved");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (isApproved !== null) where.isApproved = isApproved === "true";
    if (status) where.availabilityStatus = status;

    const [listings, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          owner: { select: { id: true, fullName: true, email: true, phone: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: listings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin list listings error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
