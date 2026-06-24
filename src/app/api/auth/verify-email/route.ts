import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { provisionVirtualAccount } from "@/lib/monnify";
import { cleanupUnverifiedAccounts } from "@/lib/cleanup";

export async function POST(request: Request) {
  try {
    cleanupUnverifiedAccounts();
    const ip = getClientIp(request);
    if (!rateLimit(`verify-email:${ip}`, 5, 900000)) {
      return NextResponse.json({ success: false, error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { email: rawEmail, otp } = await request.json();

    if (!rawEmail || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: "Email already verified" },
        { status: 200 }
      );
    }

    if (user.resetToken !== otp || !user.resetTokenExp || user.resetTokenExp < new Date()) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        resetToken: null,
        resetTokenExp: null,
      },
    });

    if (user.wallet?.monnifyAccountReference && !user.wallet.nubanAccountNumber) {
      const accountName = user.fullName;
      try {
        const monnifyRes = await provisionVirtualAccount({
          accountReference: user.wallet.monnifyAccountReference,
          accountName,
          customerEmail: user.email,
          customerName: user.fullName,
        });
        if (monnifyRes) {
          const vb = monnifyRes;
          await prisma.wallet.update({
            where: { id: user.wallet.id },
            data: {
              nubanAccountNumber: vb.accountNumber,
              bankName: vb.bankName || "Monnify Microfinance Bank",
              bankCode: vb.bankCode,
              accountName: vb.accountName || accountName,
            },
          });
        }
      } catch {
        console.warn("Monnify NUBAN provisioning failed for", user.email);
      }
    }

    return NextResponse.json(
      { success: true, message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
