-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneVerificationCode" TEXT,
ADD COLUMN     "phoneVerificationExp" TIMESTAMP(3);
