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

    const driver = await prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 }
      );
    }

    if (driver.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "You do not own this driver" },
        { status: 403 }
      );
    }

    const payments = await prisma.driverPayment.findMany({
      where: { driverId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: payments }, { status: 200 });
  } catch (error) {
    console.error("Get driver payments error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const driver = await prisma.driver.findUnique({ where: { id } });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 }
      );
    }

    if (driver.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You do not own this driver" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentType, amount, periodStart, periodEnd, description, paidAt } = body;

    if (!paymentType || !amount) {
      return NextResponse.json(
        { success: false, error: "paymentType and amount are required" },
        { status: 400 }
      );
    }

    const payment = await prisma.driverPayment.create({
      data: {
        driverId: id,
        paymentType,
        amount: parseFloat(amount),
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        description: description || null,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paidBy: session.user.id,
      },
    });

    return NextResponse.json(
      { success: true, data: payment, message: "Payment recorded" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create driver payment error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
