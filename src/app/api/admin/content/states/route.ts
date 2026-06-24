import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const states = await prisma.state.findMany({ include: { lgas: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ success: true, data: states });
  } catch (error) {
    console.error("States GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const state = await prisma.state.create({ data: { name: body.name, slug: body.slug, sortOrder: body.sortOrder || 0 } });
    return NextResponse.json({ success: true, data: state });
  } catch (error) {
    console.error("States POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
