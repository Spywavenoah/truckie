import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullName: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, fullName: true, role: true } } },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    if (ticket.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    let assignedToUser = null;
    if (ticket.assignedTo) {
      assignedToUser = await prisma.user.findUnique({
        where: { id: ticket.assignedTo },
        select: { id: true, fullName: true, email: true },
      });
    }

    return NextResponse.json(
      { success: true, data: { ...ticket, assignedToUser } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get ticket error:", error);
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
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    if (ticket.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    if (body.status && body.status !== "CLOSED") {
      return NextResponse.json(
        { success: false, error: "Only closing the ticket is allowed" },
        { status: 400 }
      );
    }

    if (ticket.status === "CLOSED") {
      return NextResponse.json(
        { success: false, error: "Ticket is already closed" },
        { status: 409 }
      );
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    let assignedToUser = null;
    if (updated.assignedTo) {
      assignedToUser = await prisma.user.findUnique({
        where: { id: updated.assignedTo },
        select: { id: true, fullName: true, email: true },
      });
    }

    return NextResponse.json(
      { success: true, data: { ...updated, assignedToUser }, message: "Ticket closed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
