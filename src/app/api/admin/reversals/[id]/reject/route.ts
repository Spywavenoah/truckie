import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    if (!body.adminNote || typeof body.adminNote !== "string" || !body.adminNote.trim()) {
      return NextResponse.json(
        { success: false, error: "Admin note is required to reject a reversal" },
        { status: 400 }
      );
    }

    const reversal = await prisma.reversalRequest.findUnique({ where: { id } });
    if (!reversal) {
      return NextResponse.json(
        { success: false, error: "Reversal request not found" },
        { status: 404 }
      );
    }

    if (reversal.status !== "PENDING" && reversal.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { success: false, error: `Cannot reject reversal with status ${reversal.status}` },
        { status: 409 }
      );
    }

    const updated = await prisma.reversalRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        adminId: session.user.id,
        adminNote: body.adminNote.trim(),
        reviewedAt: new Date(),
      },
      include: {
        requester: { select: { id: true, fullName: true, email: true } },
        admin: { select: { id: true, fullName: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "REVERSAL_REJECT",
        resource: "ReversalRequest",
        resourceId: id,
        detail: `Rejected reversal request for $${reversal.amount}. Note: ${body.adminNote.trim()}`,
      },
    });

    return NextResponse.json(
      { success: true, data: updated, message: "Reversal request rejected" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject reversal error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
