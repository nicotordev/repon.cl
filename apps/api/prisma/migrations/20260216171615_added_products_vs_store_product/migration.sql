/*
  Warnings:

  - You are about to drop the column `defaultShelfLifeDays` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isPerishable` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isVatExempt` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `salePriceGross` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `vatRateBps` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_storeId_fkey";

-- DropIndex
DROP INDEX "Product_storeId_idx";

-- DropIndex
DROP INDEX "Product_storeId_name_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "defaultShelfLifeDays",
DROP COLUMN "imageUrl",
DROP COLUMN "isPerishable",
DROP COLUMN "isVatExempt",
DROP COLUMN "salePriceGross",
DROP COLUMN "storeId",
DROP COLUMN "vatRateBps";

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "salePriceGross" INTEGER,
    "vatRateBps" INTEGER NOT NULL DEFAULT 1900,
    "isVatExempt" BOOLEAN NOT NULL DEFAULT false,
    "isPerishable" BOOLEAN NOT NULL DEFAULT false,
    "defaultShelfLifeDays" INTEGER,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreProduct_storeId_idx" ON "StoreProduct"("storeId");

-- CreateIndex
CREATE INDEX "StoreProduct_productId_idx" ON "StoreProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_storeId_productId_key" ON "StoreProduct"("storeId", "productId");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
