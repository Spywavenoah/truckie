import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { code } = await request.json();
    if (!code) return NextResponse.json({ success: false, error: "Verification code is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    if (!user.phoneVerificationCode || !user.phoneVerificationExp) {
      return NextResponse.json({ success: false, error: "No OTP requested. Please request a new code." }, { status: 400 });
    }

    if (new Date() > user.phoneVerificationExp) {
      return NextResponse.json({ success: false, error: "OTP has expired. Please request a new code." }, { status: 400 });
    }

    if (user.phoneVerificationCode !== code) {
      return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneVerified: new Date(),
        phoneVerificationCode: null,
        phoneVerificationExp: null,
      },
    });

    return NextResponse.json({ success: true, message: "Phone verified" });
  } catch (error) {
    console.error("Verify phone error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
