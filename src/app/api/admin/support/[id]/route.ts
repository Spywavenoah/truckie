import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function enrichTicket(ticket: Record<string, unknown>) {
  let assignedToUser = null;
  if (ticket.assignedTo) {
    assignedToUser = await prisma.user.findUnique({
      where: { id: ticket.assignedTo as string },
      select: { id: true, fullName: true, email: true, role: true },
    });
  }
  return { ...ticket, assignedToUser };
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullName: true, email: true, role: true, phone: true } },
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

    const enriched = await enrichTicket(ticket as unknown as Record<string, unknown>);

    return NextResponse.json({ success: true, data: enriched }, { status: 200 });
  } catch (error) {
    console.error("Admin get ticket error:", error);
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

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (body.status) {
      if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status value" },
          { status: 400 }
        );
      }
      data.status = body.status;
      if (body.status === "RESOLVED") data.resolvedAt = new Date();
      if (body.status === "CLOSED") data.closedAt = new Date();
    }

    if (body.priority) {
      if (!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(body.priority)) {
        return NextResponse.json(
          { success: false, error: "Invalid priority value" },
          { status: 400 }
        );
      }
      data.priority = body.priority;
    }

    if (body.assignedTo !== undefined) {
      if (body.assignedTo === null) {
        data.assignedTo = null;
      } else {
        const adminUser = await prisma.user.findUnique({ where: { id: body.assignedTo } });
        if (!adminUser || adminUser.role !== "ADMIN") {
          return NextResponse.json(
            { success: false, error: "Assigned user must be an admin" },
            { status: 400 }
          );
        }
        data.assignedTo = body.assignedTo;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, fullName: true, email: true, role: true, phone: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, fullName: true, role: true } } },
        },
      },
    });

    const enriched = await enrichTicket(updated as unknown as Record<string, unknown>);

    return NextResponse.json(
      { success: true, data: enriched, message: "Ticket updated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update ticket error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
