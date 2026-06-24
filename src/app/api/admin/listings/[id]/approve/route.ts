import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const listing = await prisma.asset.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.isApproved) {
      return NextResponse.json(
        { success: false, error: "Listing is already approved" },
        { status: 409 }
      );
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        isApproved: true,
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
        action: "LISTING_APPROVE",
        resource: "Asset",
        resourceId: id,
        detail: `Approved listing "${listing.title}"`,
      },
    });

    return NextResponse.json(
      { success: true, data: updated, message: "Listing approved" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Approve listing error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
