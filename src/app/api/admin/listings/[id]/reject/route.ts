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

    if (!body.reason || typeof body.reason !== "string" || !body.reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const listing = await prisma.asset.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        isApproved: false,
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "LISTING_REJECT",
        resource: "Asset",
        resourceId: id,
        detail: `Rejected listing "${listing.title}". Reason: ${body.reason.trim()}`,
      },
    });

    return NextResponse.json(
      { success: true, data: updated, message: "Listing rejected" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject listing error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
