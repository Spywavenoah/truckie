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
    const type = searchParams.get("type") || "";

    const logs = await prisma.maintenanceLog.findMany({
      where: {
        asset: { ownerId: session.user.id },
        ...(type ? { maintenanceType: type as any } : {}),
        ...(search
          ? {
              OR: [
                { description: { contains: search, mode: "insensitive" } },
                { vendorName: { contains: search, mode: "insensitive" } },
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
    console.error("Get owner maintenance error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch maintenance logs" }, { status: 500 });
  }
}
