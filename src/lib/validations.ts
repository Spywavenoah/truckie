import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

export const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, "Invalid Nigerian phone number"),
  password: passwordSchema,
  role: z.enum(["OWNER", "CLIENT"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createAssetSchema = z.object({
  type: z.enum(["TRUCK", "EQUIPMENT", "MATERIAL"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  category: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1990).max(2030).optional(),
  plateNumber: z.string().optional(),
  capacity: z.number().positive().optional(),
  unit: z.string().optional(),
  pricePerDay: z.number().positive().optional(),
  pricePerHour: z.number().positive().optional(),
  pricePerTon: z.number().positive().optional(),
  location: z.string().optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
});

export const createBookingSchema = z.object({
  assetId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  purpose: z.string().optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  clientNote: z.string().optional(),
});

export const maintenanceLogSchema = z.object({
  maintenanceType: z.enum([
    "ROUTINE",
    "REPAIR",
    "INSPECTION",
    "TIRE",
    "ENGINE",
    "OTHER",
  ]),
  description: z.string().optional(),
  cost: z.number().positive().optional(),
  vendorName: z.string().optional(),
  vendorPhone: z.string().optional(),
  odometerReading: z.number().positive().optional(),
  nextDueDate: z.string().datetime().optional(),
  nextDueOdometer: z.number().positive().optional(),
  performedBy: z.string().optional(),
});

export const fuelLogSchema = z.object({
  date: z.string().datetime().optional(),
  litersIssued: z.number().positive(),
  costPerLiter: z.number().positive(),
  totalCost: z.number().positive().optional(),
  odometerReading: z.number().positive().optional(),
  fuelStation: z.string().optional(),
  attendant: z.string().optional(),
  notes: z.string().optional(),
});

export const driverSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  licenseNumber: z.string().optional(),
  licenseClass: z.string().optional(),
  licenseExpiry: z.string().datetime().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
});

export const driverPaymentSchema = z.object({
  driverId: z.string(),
  paymentType: z.enum(["SALARY", "ALLOWANCE", "BONUS", "DEDUCTION"]),
  amount: z.number().positive(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  description: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});

export const withdrawalSchema = z.object({
  amount: z.number().min(1000, "Minimum withdrawal is ₦1,000"),
  destinationBank: z.string(),
  destinationAccount: z.string(),
  accountName: z.string(),
});

export const reversalSchema = z.object({
  transactionId: z.string(),
  bookingId: z.string().optional(),
  reason: z.string().min(10, "Please provide a detailed reason"),
  evidenceUrl: z.string().optional(),
});

export const supportTicketSchema = z.object({
  category: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

export const ticketMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const twoFactorSchema = z.object({
  token: z.string().length(6, "Token must be 6 digits"),
});

export const twoFactorSetupSchema = z.object({
  token: z.string().length(6, "Verification code must be 6 digits"),
});
