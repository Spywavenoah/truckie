import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("monnify-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing signature" },
        { status: 400 }
      );
    }

    const secret = process.env.MONNIFY_SECRET_KEY;
    if (!secret) {
      console.error("MONNIFY_SECRET_KEY is not configured");
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 500 }
      );
    }

    const computedSignature = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (computedSignature !== signature) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const { eventType, eventData } = payload;

    if (eventType === "SUCCESSFUL_TRANSACTION") {
      const { amount, paymentReference, transactionReference, customerEmail, destinationAccountNumber } = eventData;

      let user = null;
      if (customerEmail) {
        user = await prisma.user.findUnique({
          where: { email: customerEmail },
          include: { wallet: true },
        });
      }

      if ((!user || !user.wallet) && destinationAccountNumber) {
        const wallet = await prisma.wallet.findFirst({
          where: { nubanAccountNumber: destinationAccountNumber },
          include: { user: true },
        });
        if (wallet) {
          user = { ...wallet.user, wallet };
        }
      }

      if (!user || !user.wallet) {
        console.error(`Webhook: user or wallet not found for ${customerEmail || destinationAccountNumber}`);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const existing = await prisma.walletTransaction.findFirst({
        where: { monnifyRef: transactionReference },
      });

      if (existing) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const parsedAmount = typeof amount === "number" ? amount : parseFloat(amount);

      await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId: user.id },
        });

        if (!wallet) return;

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: parsedAmount } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: parsedAmount,
            description: `Wallet funding via Monnify`,
            reference: paymentReference,
            monnifyRef: transactionReference,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance + parsedAmount,
            metadata: payload,
          },
        });
      });
    }

    if (eventType === "DISBURSEMENT_SUCCESSFUL") {
      const { transactionReference, amount } = eventData;
      const withdrawal = await prisma.withdrawal.findFirst({
        where: { reference: transactionReference },
      });
      if (withdrawal) {
        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: "PROCESSED", monnifyRef: transactionReference, processedAt: new Date() },
        });
      }
    }

    if (eventType === "DISBURSEMENT_FAILED") {
      const { transactionReference, amount } = eventData;
      const withdrawal = await prisma.withdrawal.findFirst({
        where: { reference: transactionReference },
      });
      if (withdrawal) {
        await prisma.$transaction(async (tx) => {
          await tx.withdrawal.update({
            where: { id: withdrawal.id },
            data: { status: "FAILED", monnifyRef: transactionReference },
          });
          await tx.wallet.update({
            where: { id: withdrawal.walletId },
            data: { balance: { increment: withdrawal.amount } },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: withdrawal.walletId,
              type: "CREDIT",
              amount: withdrawal.amount,
              description: `Failed withdrawal reversal — ${transactionReference}`,
              reference: `REV-${withdrawal.reference}`,
            },
          });
        });
      }
    }

    if (eventType === "RESERVED_ACCOUNT_CREATED") {
      const { accountReference, accounts, customerEmail } = eventData;
      const user = await prisma.user.findUnique({ where: { email: customerEmail } });
      if (user && accounts && accounts.length > 0) {
        const nuban = accounts.find((a: { bankCode: string }) => a.bankCode === "035") || accounts[0];
        await prisma.wallet.update({
          where: { userId: user.id },
          data: {
            monnifyAccountReference: accountReference,
            nubanAccountNumber: nuban.accountNumber,
            bankName: nuban.bankName,
            bankCode: nuban.bankCode,
            accountName: nuban.accountName,
          },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Monnify webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
