import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await prisma.twoFactorAuth.deleteMany({ where: { userId: id } });

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "USER_2FA_RESET",
        resource: "User",
        resourceId: id,
        detail: "Admin reset user's two-factor authentication",
      },
    });

    return NextResponse.json({ success: true, message: "2FA has been reset. User can set up fresh." }, { status: 200 });
  } catch (error) {
    console.error("Admin reset 2FA error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
