import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.smtpSettings.findFirst();
  if (!settings) {
    return NextResponse.json({ success: true, data: null }, { status: 200 });
  }

  const { password, ...safe } = settings;
  return NextResponse.json({ success: true, data: safe }, { status: 200 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { host, port, username, password, fromEmail, fromName, secure } = body;

    if (!host || !username || !fromEmail) {
      return NextResponse.json(
        { success: false, error: "Host, username, and fromEmail are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.smtpSettings.findFirst();
    const data: Record<string, unknown> = {
      host,
      port: port || 587,
      username,
      fromEmail,
      fromName: fromName || null,
      secure: secure || false,
      isActive: true,
    };

    if (password) data.password = password;

    if (existing) {
      await prisma.smtpSettings.update({ where: { id: existing.id }, data: data as any });
    } else {
      if (!password) {
        return NextResponse.json(
          { success: false, error: "Password is required for new configuration" },
          { status: 400 }
        );
      }
      await prisma.smtpSettings.create({ data: data as any });
    }

    return NextResponse.json({ success: true, message: "SMTP settings saved" }, { status: 200 });
  } catch (error) {
    console.error("SMTP settings error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.smtpSettings.findFirst();
  if (existing) {
    await prisma.smtpSettings.delete({ where: { id: existing.id } });
  }

  return NextResponse.json({ success: true, message: "SMTP settings cleared" }, { status: 200 });
}
