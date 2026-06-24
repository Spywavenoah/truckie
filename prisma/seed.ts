import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const userPasswordHash = await bcrypt.hash("User@123", 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@truckleasepro.com" },
    update: {},
    create: {
      fullName: "Admin User",
      email: "admin@truckleasepro.com",
      phone: "+2348012345000",
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
      status: "ACTIVE",
    },
  });
  console.log(`  ✓ Admin user created: ${admin.email}`);

  // Create owner users
  const owner1 = await prisma.user.upsert({
    where: { email: "chinedu@example.com" },
    update: {},
    create: {
      fullName: "Chinedu Okonkwo",
      email: "chinedu@example.com",
      phone: "+2348023456001",
      passwordHash: userPasswordHash,
      role: "OWNER",
      emailVerified: new Date(),
      status: "ACTIVE",
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: "amina@example.com" },
    update: {},
    create: {
      fullName: "Amina Suleiman",
      email: "amina@example.com",
      phone: "+2348034567002",
      passwordHash: userPasswordHash,
      role: "OWNER",
      emailVerified: new Date(),
      status: "ACTIVE",
    },
  });
  console.log(`  ✓ Owner users created: ${owner1.email}, ${owner2.email}`);

  // Create client users
  const client1 = await prisma.user.upsert({
    where: { email: "emeka@example.com" },
    update: {},
    create: {
      fullName: "Emeka Nwachukwu",
      email: "emeka@example.com",
      phone: "+2348045678003",
      passwordHash: userPasswordHash,
      role: "CLIENT",
      emailVerified: new Date(),
      status: "ACTIVE",
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: "fati@example.com" },
    update: {},
    create: {
      fullName: "Hauwa Fati",
      email: "fati@example.com",
      phone: "+2348056789004",
      passwordHash: userPasswordHash,
      role: "CLIENT",
      emailVerified: new Date(),
      status: "ACTIVE",
    },
  });
  console.log(`  ✓ Client users created: ${client1.email}, ${client2.email}`);

  // Create wallets for all users
  const users = [admin, owner1, owner2, client1, client2];
  for (const user of users) {
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        nubanAccountNumber: `12345678${String(users.indexOf(user) + 1).padStart(2, "0")}`,
        bankName: "Wema Bank",
        bankCode: "035",
        accountName: user.fullName,
        balance: user.role === "ADMIN" ? 500000 : user.role === "CLIENT" ? 200000 : 100000,
        currency: "NGN",
        monnifyAccountReference: `TKLP-USER-${user.id.substring(0, 8)}`,
      },
    });
  }
  console.log("  ✓ Wallets created for all users");

  // Create assets (trucks)
  const truck1 = await prisma.asset.create({
    data: {
      ownerId: owner1.id,
      type: "TRUCK",
      title: "2024 Sino 6-Ton Tipper Truck",
      description:
        "Well-maintained tipper truck for sand, granite, and construction material haulage. Available for daily or weekly hire.",
      category: "Tipper",
      make: "Sino",
      model: "ST6-2024",
      year: 2024,
      plateNumber: "LND-789-XY",
      capacity: 6,
      unit: "tons",
      pricePerDay: 85000,
      pricePerHour: 12000,
      currency: "NGN",
      location: "Ikeja, Lagos",
      state: "Lagos",
      lga: "Ikeja",
      availabilityStatus: "AVAILABLE",
      isApproved: true,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  const truck2 = await prisma.asset.create({
    data: {
      ownerId: owner1.id,
      type: "TRUCK",
      title: "Mercedes-Benz Actros 2645 Fuel Tanker",
      description:
        "40,000-liter fuel tanker for petroleum product transportation. Fully licensed with all safety equipment.",
      category: "Tanker",
      make: "Mercedes-Benz",
      model: "Actros 2645",
      year: 2023,
      plateNumber: "KJA-456-PQ",
      capacity: 40000,
      unit: "liters",
      pricePerDay: 250000,
      pricePerHour: 35000,
      currency: "NGN",
      location: "Port Harcourt, Rivers",
      state: "Rivers",
      lga: "Port Harcourt",
      availabilityStatus: "AVAILABLE",
      isApproved: true,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  const truck3 = await prisma.asset.create({
    data: {
      ownerId: owner2.id,
      type: "TRUCK",
      title: "Isuzu N-Series 5-Ton Refrigerated Truck",
      description:
        "Refrigerated truck ideal for perishable goods, food, and pharmaceutical transport. Temperature-controlled cargo area.",
      category: "Refrigerated",
      make: "Isuzu",
      model: "N-Series 5T",
      year: 2024,
      plateNumber: "LAG-123-ABC",
      capacity: 5,
      unit: "tons",
      pricePerDay: 120000,
      pricePerHour: 18000,
      currency: "NGN",
      location: "Lekki, Lagos",
      state: "Lagos",
      lga: "Eti Osa",
      availabilityStatus: "AVAILABLE",
      isApproved: true,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  // Create equipment
  const equipment1 = await prisma.asset.create({
    data: {
      ownerId: owner2.id,
      type: "EQUIPMENT",
      title: "Caterpillar 320D Excavator",
      description:
        "Heavy-duty excavator for construction and mining. Comes with operator and basic maintenance.",
      category: "Excavator",
      make: "Caterpillar",
      model: "320D",
      year: 2022,
      pricePerDay: 180000,
      pricePerHour: 25000,
      currency: "NGN",
      location: "Abuja",
      state: "FCT",
      lga: "Abuja Municipal",
      availabilityStatus: "AVAILABLE",
      isApproved: true,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  const equipment2 = await prisma.asset.create({
    data: {
      ownerId: owner1.id,
      type: "EQUIPMENT",
      title: "Komatsu D155A Bulldozer",
      description:
        "Powerful bulldozer for earthmoving and site preparation. Well serviced with new undercarriage.",
      category: "Bulldozer",
      make: "Komatsu",
      model: "D155A",
      year: 2021,
      pricePerDay: 220000,
      pricePerHour: 30000,
      currency: "NGN",
      location: "Kano",
      state: "Kano",
      lga: "Kano Municipal",
      availabilityStatus: "MAINTENANCE",
      isApproved: true,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  // Create materials
  const material1 = await prisma.asset.create({
    data: {
      ownerId: owner2.id,
      type: "MATERIAL",
      title: "Premium Grade Granite Chippings",
      description:
        "3/4-inch granite chippings suitable for concrete production and road construction. Sourced from our quarry in Abeokuta.",
      category: "Granite",
      pricePerTon: 45000,
      currency: "NGN",
      unit: "tons",
      location: "Abeokuta, Ogun",
      state: "Ogun",
      lga: "Abeokuta North",
      availabilityStatus: "AVAILABLE",
      isApproved: true,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  console.log("  ✓ Assets created (3 trucks, 2 equipment, 1 material)");
  console.log("  ✓ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
