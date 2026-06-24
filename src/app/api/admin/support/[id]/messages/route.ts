import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }
    if (ticket.status === "CLOSED") {
      return NextResponse.json({ success: false, error: "Cannot reply to a closed ticket" }, { status: 400 });
    }

    await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: session.user.id,
        senderRole: "ADMIN",
        message: message.trim(),
      },
    });

    if (ticket.status === "OPEN") {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json({ success: true, message: "Reply sent" }, { status: 200 });
  } catch (error) {
    console.error("Admin reply error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
