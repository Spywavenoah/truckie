import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING,PROCESSED,REJECTED,FAILED";

    const statuses = status.split(",");

    const withdrawals = await prisma.withdrawal.findMany({
      where: { status: { in: statuses } },
      include: { wallet: { include: { user: { select: { fullName: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: withdrawals }, { status: 200 });
  } catch (error) {
    console.error("Admin list withdrawals error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
