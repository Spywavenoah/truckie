import { NextResponse } from "next/server";
import { getBanks, validateBankAccount } from "@/lib/monnify";

export async function GET() {
  try {
    const banks = await getBanks();
    return NextResponse.json({ success: true, data: banks }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch banks:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch banks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { bankCode, accountNumber } = await request.json();
    if (!bankCode || !accountNumber) {
      return NextResponse.json({ success: false, error: "bankCode and accountNumber are required" }, { status: 400 });
    }
    const result = await validateBankAccount(bankCode, accountNumber);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate account";
    console.error("Failed to validate account:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
