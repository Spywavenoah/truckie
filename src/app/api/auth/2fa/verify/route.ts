import { NextResponse } from "next/server";
import crypto from "crypto";
import speakeasy from "speakeasy";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!rateLimit(`2fa-verify:${session.user.id}`, 5, 900000)) {
      return NextResponse.json({ success: false, error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { secret: rawSecret, token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    // Setup flow: secret is provided (from QR scan), save + enable 2FA
    if (rawSecret) {
      const verified = speakeasy.verify({ secret: rawSecret, encoding: "base32", token });
      if (!verified) {
        return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 });
      }

      const backupCodes = Array.from({ length: 10 }, () =>
        crypto.createHash("sha256").update(crypto.randomBytes(32).toString("hex")).digest("hex")
      );

      await prisma.twoFactorAuth.upsert({
        where: { userId: session.user.id },
        update: { secret: rawSecret, backupCodes: JSON.stringify(backupCodes), enabled: true },
        create: { userId: session.user.id, secret: rawSecret, backupCodes: JSON.stringify(backupCodes), enabled: true },
      });

      return NextResponse.json({
        success: true,
        data: { backupCodes },
        message: "2FA enabled successfully. Save your backup codes.",
      }, { status: 200 });
    }

    // Login flow: no secret provided, look up stored secret
    const twoFa = await prisma.twoFactorAuth.findUnique({ where: { userId: session.user.id } });
    if (!twoFa || !twoFa.enabled) {
      return NextResponse.json({ success: false, error: "2FA is not enabled" }, { status: 400 });
    }

    const verified = speakeasy.verify({ secret: twoFa.secret, encoding: "base32", token });
    if (!verified) {
      return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "2FA verification successful" }, { status: 200 });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
