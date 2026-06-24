import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const categories = await prisma.assetCategory.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const category = await prisma.assetCategory.create({ data: { name: body.name, slug: body.slug, icon: body.icon, sortOrder: body.sortOrder || 0 } });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
