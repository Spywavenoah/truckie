-- AlterEnum
ALTER TYPE "TransactionCategory" ADD VALUE 'FEE';

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "contactAddress" TEXT DEFAULT '42 Awolowo Road, Ikoyi, Lagos',
ADD COLUMN     "contactEmail" TEXT DEFAULT 'support@truckleasepro.com',
ADD COLUMN     "contactHours" TEXT DEFAULT 'Mon–Fri: 8:00 AM – 6:00 PM, Sat: 9:00 AM – 3:00 PM',
ADD COLUMN     "contactPhone" TEXT DEFAULT '+234 800 TRUCKLEASE';
