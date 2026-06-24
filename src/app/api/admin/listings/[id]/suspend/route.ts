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
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    const newStatus = listing.isApproved ? false : true;

    const updated = await prisma.asset.update({
      where: { id },
      data: { isApproved: newStatus },
      include: { owner: { select: { id: true, fullName: true, email: true } } },
    });

    const action = newStatus ? "LISTING_REINSTATE" : "LISTING_SUSPEND";
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action,
        resource: "Asset",
        resourceId: id,
        detail: `${newStatus ? "Reinstated" : "Suspended"} listing "${listing.title}"`,
      },
    });

    return NextResponse.json(
      { success: true, data: updated, message: newStatus ? "Listing reinstated" : "Listing suspended" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Suspend listing error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
