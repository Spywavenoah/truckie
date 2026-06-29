import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@truckie.com" },
    });

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin user already exists",
          email: "admin@truckie.com",
          password: "admin123",
        },
        { status: 200 }
      );
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: "admin@truckie.com",
        fullName: "Admin User",
        passwordHash: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Admin user created successfully",
        email: "admin@truckie.com",
        password: "admin123",
        userId: admin.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create admin user",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: "admin@truckie.com" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    if (admin) {
      return NextResponse.json(
        {
          success: true,
          message: "Admin user exists",
          admin,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Admin user does not exist. POST to create one.",
      },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
