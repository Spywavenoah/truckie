import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone, phoneVerificationCode: code, phoneVerificationExp: expires },
    });

    console.log(`[OTP] User ${session.user.id} -> ${phone}: ${code}`);

    try {
      const { sendEmail } = await import("@/lib/email");
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user) {
        await sendEmail({
          to: user.email,
          subject: "Your Phone Verification Code",
          html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
        });
      }
    } catch {}

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
