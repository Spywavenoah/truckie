import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, verificationEmailHtml } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!rateLimit(`resend-verification:${ip}`, 3, 300000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Try again in 5 minutes." }, { status: 429 });
    }

    const { email: rawEmail } = await request.json();

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const email = rawEmail.toLowerCase();

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: false, error: "Email is already verified. Please log in." }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: otp, resetTokenExp: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendEmail({ to: email, subject: "Verify Your Email", html: verificationEmailHtml(otp, email, BASE_URL) });

    return NextResponse.json(
      { success: true, message: "Verification code sent. Check your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
