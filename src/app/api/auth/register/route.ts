import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { generateReference } from "@/lib/utils";
import { sendEmail, verificationEmailHtml } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!rateLimit(`register:${ip}`, 5, 3600000)) {
      return NextResponse.json({ success: false, error: "Too many registration attempts. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { fullName, email: rawEmail, phone, password, role } = validated.data;
    const email = rawEmail.toLowerCase();

    const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        role,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await prisma.wallet.create({
      data: {
        userId: user.id,
        currency: "NGN",
        balance: 0,
        bankName: "Monnify Microfinance Bank",
        monnifyAccountReference: `${generateReference("TKLP")}-${user.id.substring(0, 8)}`,
      },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: otp, resetTokenExp: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendEmail({ to: email, subject: "Verify Your Email", html: verificationEmailHtml(otp, email, BASE_URL) });

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: "Registration successful. Please check your email to verify.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
