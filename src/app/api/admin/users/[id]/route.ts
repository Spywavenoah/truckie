import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function logAudit(adminId: string, action: string, resource: string, resourceId: string, detail?: string) {
  await prisma.auditLog.create({
    data: { adminId, action, resource, resourceId, detail },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        bankCode: true,
        bankAccountNumber: true,
        deactivatedAt: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            accountName: true,
            nubanAccountNumber: true,
            bankName: true,
            currency: true,
          },
        },
        _count: {
          select: {
            assets: true,
            bookingsAsOwner: true,
            bookingsAsClient: true,
            sessions: true,
            tickets: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    console.error("Admin get user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, role } = body;

    if (!["disable", "enable", "reset", "changeRole"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be disable, enable, reset, or changeRole" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role === "ADMIN" && action !== "reset") {
      return NextResponse.json(
        { success: false, error: "Cannot disable or enable other admin accounts" },
        { status: 403 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "disable":
        updateData = { status: "SUSPENDED", deactivatedAt: new Date() };
        break;
      case "enable":
        updateData = { status: "ACTIVE", deactivatedAt: null };
        break;
      case "reset":
        updateData = {
          resetToken: null,
          resetTokenExp: null,
          status: "ACTIVE",
          deactivatedAt: null,
        };
        break;
      case "changeRole":
        if (!["OWNER", "CLIENT", "ADMIN", "MODERATOR", "SUPPORT", "FINANCE"].includes(role)) {
          return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
        }
        updateData = { role };
        break;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        deactivatedAt: true,
      },
    });

    await logAudit(session.user.id, `USER_${action.toUpperCase()}`, "User", id);

    return NextResponse.json(
      { success: true, data: updated, message: `User ${action}d successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const deleted = await prisma.userSession.deleteMany({ where: { userId: id } });

    await logAudit(session.user.id, "USER_FORCE_LOGOUT", "User", id, `Deleted ${deleted.count} sessions`);

    return NextResponse.json(
      {
        success: true,
        data: { sessionsDeleted: deleted.count },
        message: "All user sessions deleted. User forced to log out.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin force logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
