import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { singlePayment } from "@/lib/monnify";
import { generateReference } from "@/lib/utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { wallet: { include: { user: true } } },
    });

    if (!withdrawal) {
      return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 });
    }
    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ success: false, error: "Withdrawal is not in PENDING status" }, { status: 400 });
    }

    const platformWalletRef = process.env.MONNIFY_PLATFORM_ACCOUNT;
    if (!platformWalletRef) {
      return NextResponse.json({ success: false, error: "Platform account not configured" }, { status: 500 });
    }

    const ref = generateReference("DSP");

    try {
      await singlePayment({
        amount: withdrawal.amount,
        reference: ref,
        narration: `Withdrawal payout to ${withdrawal.accountName}`,
        destinationBankCode: withdrawal.destinationBank || "",
        destinationAccountNumber: withdrawal.destinationAccount || "",
        sourceAccountNumber: platformWalletRef,
      });
    } catch {
      return NextResponse.json({ success: false, error: "Disbursement failed. Check bank details and try again." }, { status: 502 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: "PROCESSED", reference: ref, processedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "WITHDRAWAL_APPROVED",
          resource: "Withdrawal",
          resourceId: id,
          detail: `Approved withdrawal of ₦${withdrawal.amount.toLocaleString()} to ${withdrawal.accountName} (${withdrawal.destinationBank})`,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Withdrawal approved and disbursed" }, { status: 200 });
  } catch (error) {
    console.error("Admin approve withdrawal error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
