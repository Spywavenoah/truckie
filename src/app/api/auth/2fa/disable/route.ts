import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { password, totp } = await request.json();

    if (!password || !totp) {
      return NextResponse.json(
        { success: false, error: "Password and TOTP code are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { twoFactorAuth: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 400 }
      );
    }

    if (!user.twoFactorAuth) {
      return NextResponse.json(
        { success: false, error: "2FA is not enabled" },
        { status: 400 }
      );
    }

    const verified = speakeasy.verify({
      secret: user.twoFactorAuth.secret,
      encoding: "base32",
      token: totp,
    });

    if (!verified) {
      return NextResponse.json(
        { success: false, error: "Invalid TOTP code" },
        { status: 400 }
      );
    }

    await prisma.twoFactorAuth.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json(
      { success: true, message: "2FA disabled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
