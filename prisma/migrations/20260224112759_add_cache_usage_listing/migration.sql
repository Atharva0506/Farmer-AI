-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'EXPIRED');

-- CreateTable
CREATE TABLE "CachedResponse" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CachedResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsageLog" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "imageUrl" TEXT,
    "description" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CachedResponse_cacheKey_key" ON "CachedResponse"("cacheKey");

-- CreateIndex
CREATE INDEX "CachedResponse_cacheKey_idx" ON "CachedResponse"("cacheKey");

-- CreateIndex
CREATE INDEX "CachedResponse_expiresAt_idx" ON "CachedResponse"("expiresAt");

-- CreateIndex
CREATE INDEX "ApiUsageLog_route_idx" ON "ApiUsageLog"("route");

-- CreateIndex
CREATE INDEX "ApiUsageLog_createdAt_idx" ON "ApiUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_cropName_idx" ON "Listing"("cropName");

-- CreateIndex
CREATE INDEX "Listing_userId_idx" ON "Listing"("userId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
