import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!rateLimit(`2fa-setup:${session.user.id}`, 3, 3600000)) {
      return NextResponse.json({ success: false, error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const secret = speakeasy.generateSecret({
      name: `TruckLease:${session.user.email}`,
      issuer: "TruckLease Pro",
    });

    const qrCodeDataUri = await qrcode.toDataURL(secret.otpauth_url!);

    return NextResponse.json(
      {
        success: true,
        data: {
          secret: secret.base32,
          otpauth_url: secret.otpauth_url,
          qrCode: qrCodeDataUri,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
