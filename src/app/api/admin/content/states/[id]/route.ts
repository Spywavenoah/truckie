import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const state = await prisma.state.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    console.error("States PUT error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    await prisma.state.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("States DELETE error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
