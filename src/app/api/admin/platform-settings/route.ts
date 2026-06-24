import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: {} });
    }

    const { monnifySecretKey, ...safe } = settings;
    return NextResponse.json({ success: true, data: { ...safe, monnifySecretKey: monnifySecretKey ? "••••••••" : "" } }, { status: 200 });
  } catch (error) {
    console.error("Platform settings get error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const allowed = [
      "companyName", "appName", "logoUrl", "faviconUrl",
      "monnifyApiKey", "monnifySecretKey", "monnifyContractCode", "monnifyBaseUrl",
      "platformFee", "escrowReleaseDelay", "minDeposit", "reversalFee",
      "contactAddress", "contactPhone", "contactEmail", "contactHours",
    ];

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "monnifySecretKey" && body[key] === "••••••••") continue;
        data[key] = body[key];
      }
    }

    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: {} });
    }

    await prisma.platformSettings.update({
      where: { id: settings.id },
      data: data as any,
    });

    return NextResponse.json({ success: true, message: "Settings saved" }, { status: 200 });
  } catch (error) {
    console.error("Platform settings save error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
