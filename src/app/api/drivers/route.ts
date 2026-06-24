import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { driverSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const ownerId = session.user.role === "ADMIN" ? undefined : session.user.id;
    const where = ownerId ? { ownerId } : {};
    const drivers = await prisma.driver.findMany({
      where,
      include: { _count: { select: { payments: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: drivers }, { status: 200 });
  } catch (error) {
    console.error("List drivers error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ success: false, error: "Only owners can add drivers" }, { status: 403 });
    }
    const body = await request.json();
    const validated = driverSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 });
    }
    const { licenseExpiry, ...rest } = validated.data;
    const driver = await prisma.driver.create({
      data: {
        ...rest,
        ownerId: session.user.id,
        dateOfJoining: new Date(),
        ...(licenseExpiry ? { licenseExpiry: new Date(licenseExpiry) } : {}),
      },
    });
    return NextResponse.json({ success: true, data: driver, message: "Driver added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Create driver error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
