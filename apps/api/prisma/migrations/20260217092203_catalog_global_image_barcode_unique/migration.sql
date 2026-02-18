/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `ProductBarcode` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProductBarcode_productId_code_key";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageUrl" TEXT;

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBarcode_code_key" ON "ProductBarcode"("code");
