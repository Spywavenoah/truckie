import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function createTestUser() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  try {
    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { email: "test@example.com" },
    });

    if (existing) {
      console.log("Test user already exists");
      return;
    }

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
    console.log("✓ Test user created:", user.email);
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
