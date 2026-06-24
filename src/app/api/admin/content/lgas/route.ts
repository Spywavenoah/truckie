import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const lgas = await prisma.lGA.findMany({ include: { state: { select: { name: true } } }, orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ success: true, data: lgas });
  } catch (error) {
    console.error("LGAs GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const lga = await prisma.lGA.create({ data: { stateId: body.stateId, name: body.name, slug: body.slug, sortOrder: body.sortOrder || 0 } });
    return NextResponse.json({ success: true, data: lga });
  } catch (error) {
    console.error("LGAs POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
