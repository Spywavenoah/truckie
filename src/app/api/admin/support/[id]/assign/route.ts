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

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Support ticket not found" },
        { status: 404 }
      );
    }

    if (ticket.assignedTo === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Ticket is already assigned to you" },
        { status: 409 }
      );
    }

    const statusUpdate: Record<string, unknown> = {
      assignedTo: session.user.id,
    };
    if (ticket.status === "OPEN") {
      statusUpdate.status = "IN_PROGRESS";
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: statusUpdate,
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "TICKET_ASSIGN",
        resource: "SupportTicket",
        resourceId: id,
        detail: `Assigned ticket ${ticket.ticketNumber} to self`,
      },
    });

    return NextResponse.json(
      { success: true, data: updated, message: "Ticket assigned" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Assign ticket error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
