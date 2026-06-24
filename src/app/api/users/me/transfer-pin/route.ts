import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!rateLimit(`transfer-pin:${session.user.id}`, 3, 3600000)) {
      return NextResponse.json({ success: false, error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { currentPin, newPin } = await request.json();

    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json({ success: false, error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (user?.transferPin) {
      if (!currentPin) {
        return NextResponse.json({ success: false, error: "Current PIN is required to change" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPin, user.transferPin);
      if (!valid) {
        return NextResponse.json({ success: false, error: "Current PIN is incorrect" }, { status: 400 });
      }
    }

    const hashedPin = await bcrypt.hash(newPin, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { transferPin: hashedPin },
    });

    return NextResponse.json({ success: true, message: "Transfer PIN set successfully" });
  } catch (error) {
    console.error("Transfer pin error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
