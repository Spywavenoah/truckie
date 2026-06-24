import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!rateLimit(`withdraw-otp:${session.user.id}`, 3, 3600000)) {
      return NextResponse.json({ success: false, error: "Too many withdrawal requests. Try again later." }, { status: 429 });
    }

    const { amount, destinationBank, destinationAccount, accountName } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }
    if (!destinationBank || !destinationAccount || !accountName) {
      return NextResponse.json({ success: false, error: "Bank details are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.transferPin) {
      return NextResponse.json({ success: false, error: "Set a transfer PIN in Settings before withdrawing" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 });
    }

    if (wallet.balance - amount < 1000) {
      return NextResponse.json({ success: false, error: "Minimum balance of ₦1,000 must be maintained" }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExp = new Date(Date.now() + 10 * 60 * 1000);

    const withdrawal = await prisma.withdrawal.create({
      data: {
        walletId: wallet.id,
        amount,
        destinationBank,
        destinationAccount,
        accountName,
        reference: generateReference("WTH"),
        status: "PENDING_OTP",
        otpCode: otp,
        otpExp,
      },
    });

    await sendEmail({
      to: user.email,
      subject: "Withdrawal OTP Verification",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#002366">Withdrawal Verification</h2>
          <p>You requested a withdrawal of <strong>₦${amount.toLocaleString()}</strong> to ${accountName} (${destinationBank}).</p>
          <p>Your OTP code is:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#CC0000;text-align:center;padding:16px;background:#f5f5f5;border-radius:8px">${otp}</div>
          <p style="color:#666;font-size:14px">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee"/>
          <p style="color:#999;font-size:12px">TruckLease Pro</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      data: { withdrawalId: withdrawal.id },
      message: "OTP sent to your email. Enter the code and your transfer PIN to confirm.",
    }, { status: 201 });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
