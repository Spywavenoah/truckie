import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { email: "test@example.com" },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Test user already exists",
        email: existing.email,
      });
    }

    const hashedPassword = await bcrypt.hash("password123", 10);

    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        fullName: "Test User",
        passwordHash: hashedPassword,
        role: "CLIENT",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test user created",
      email: user.email,
      password: "password123",
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
