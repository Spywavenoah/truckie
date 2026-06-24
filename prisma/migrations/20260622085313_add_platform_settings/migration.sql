-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'TruckLease Pro',
    "appName" TEXT NOT NULL DEFAULT 'TruckLease Pro',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "monnifyApiKey" TEXT NOT NULL DEFAULT '',
    "monnifySecretKey" TEXT NOT NULL DEFAULT '',
    "monnifyContractCode" TEXT NOT NULL DEFAULT '',
    "monnifyBaseUrl" TEXT NOT NULL DEFAULT 'https://sandbox.monnify.com',
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "escrowReleaseDelay" INTEGER NOT NULL DEFAULT 48,
    "minDeposit" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    "reversalFee" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
