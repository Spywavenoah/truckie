import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { driverSchema } from "@/lib/validations";

async function getDriverOrThrow(id: string, userId: string, role: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new Error("NOT_FOUND");
  if (role !== "ADMIN" && driver.ownerId !== userId) throw new Error("FORBIDDEN");
  return driver;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const driver = await getDriverOrThrow(id, session.user.id, session.user.role);
    return NextResponse.json({ success: true, data: driver }, { status: 200 });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Driver not found" }, { status: 404 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.error("Get driver error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await getDriverOrThrow(id, session.user.id, session.user.role);
    const body = await request.json();
    const validated = driverSchema.partial().safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 });
    }
    const { licenseExpiry, ...rest } = validated.data;
    const data: Record<string, unknown> = { ...rest };
    if (licenseExpiry !== undefined) {
      data.licenseExpiry = licenseExpiry ? new Date(licenseExpiry) : null;
    }
    const driver = await prisma.driver.update({
      where: { id },
      data: data as any,
    });
    return NextResponse.json({ success: true, data: driver, message: "Driver updated successfully" }, { status: 200 });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Driver not found" }, { status: 404 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.error("Update driver error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await getDriverOrThrow(id, session.user.id, session.user.role);
    await prisma.driver.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Driver deleted successfully" }, { status: 200 });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Driver not found" }, { status: 404 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.error("Delete driver error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
