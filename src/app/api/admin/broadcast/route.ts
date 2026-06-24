import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { title, message, type, role: targetRole } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
    }

    const where = targetRole && targetRole !== "ALL" ? { role: targetRole as any, status: "ACTIVE" as const } : { status: "ACTIVE" as const };

    const users = await prisma.user.findMany({ where, select: { id: true } });

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        message,
        type: type || "announcement",
      })),
    });

    return NextResponse.json({ success: true, message: `Notification sent to ${users.length} user(s)` });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
