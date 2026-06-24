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

    if (!body.escalationReason || typeof body.escalationReason !== "string" || !body.escalationReason.trim()) {
      return NextResponse.json(
        { success: false, error: "Escalation reason is required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Support ticket not found" },
        { status: 404 }
      );
    }

    if (ticket.status === "ESCALATED") {
      return NextResponse.json(
        { success: false, error: "Ticket is already escalated" },
        { status: 409 }
      );
    }

    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      return NextResponse.json(
        { success: false, error: "Cannot escalate a resolved or closed ticket" },
        { status: 409 }
      );
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: "ESCALATED",
        escalatedAt: new Date(),
        escalatedBy: session.user.id,
        escalationReason: body.escalationReason.trim(),
      },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "TICKET_ESCALATE",
        resource: "SupportTicket",
        resourceId: id,
        detail: `Escalated ticket ${ticket.ticketNumber}. Reason: ${body.escalationReason.trim()}`,
      },
    });

    return NextResponse.json(
      { success: true, data: updated, message: "Ticket escalated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Escalate ticket error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
