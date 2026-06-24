import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const logs = await prisma.fuelLog.findMany({
      where: {
        asset: { ownerId: session.user.id },
        ...(search
          ? {
              OR: [
                { fuelStation: { contains: search, mode: "insensitive" } },
                { notes: { contains: search, mode: "insensitive" } },
                { asset: { title: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        asset: { select: { id: true, title: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: logs }, { status: 200 });
  } catch (error) {
    console.error("Get owner fuel error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch fuel logs" }, { status: 500 });
  }
}
