-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('UNIT', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER');

-- CreateEnum
CREATE TYPE "StockLotSource" AS ENUM ('PURCHASE', 'MANUAL', 'ADJUSTMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "InventoryAdjustmentReason" AS ENUM ('COUNT_CORRECTION', 'DAMAGE', 'EXPIRED', 'THEFT', 'TRANSFER_OUT', 'TRANSFER_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "SaleChannel" AS ENUM ('IN_STORE', 'DELIVERY', 'ONLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BOLETA_ELECTRONICA', 'BOLETA_EXENTA', 'NOTA_CREDITO', 'OTHER');

-- CreateEnum
CREATE TYPE "SiiSubmissionStatus" AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "VoiceActionType" AS ENUM ('CREATE_SALE', 'CREATE_PURCHASE', 'ADD_STOCK', 'ADJUST_STOCK', 'MARK_EXPIRED', 'SET_PRICE', 'CREATE_ALERT', 'ASK_METRIC', 'OTHER');

-- CreateEnum
CREATE TYPE "VoiceActionStatus" AS ENUM ('PENDING', 'EXECUTED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "clerkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rut" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Santiago',
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreMember" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "uom" "UnitOfMeasure" NOT NULL DEFAULT 'UNIT',
    "salePriceGross" INTEGER,
    "vatRateBps" INTEGER NOT NULL DEFAULT 1900,
    "isVatExempt" BOOLEAN NOT NULL DEFAULT false,
    "isPerishable" BOOLEAN NOT NULL DEFAULT false,
    "defaultShelfLifeDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBarcode" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductBarcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rut" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rut" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditAccount" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "creditLimit" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "supplierId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "totalNet" INTEGER,
    "totalVat" INTEGER,
    "totalGross" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCostNet" INTEGER,
    "unitCostGross" INTEGER,
    "vatRateBps" INTEGER,
    "isVatExempt" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLot" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" "StockLotSource" NOT NULL DEFAULT 'PURCHASE',
    "purchaseId" TEXT,
    "quantityIn" INTEGER NOT NULL,
    "quantityOut" INTEGER NOT NULL DEFAULT 0,
    "unitCostNet" INTEGER,
    "unitCostGross" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAllocation" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "SaleChannel" NOT NULL DEFAULT 'IN_STORE',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "totalNet" INTEGER,
    "totalVat" INTEGER,
    "totalGross" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceGross" INTEGER NOT NULL,
    "vatRateBps" INTEGER NOT NULL DEFAULT 1900,
    "isVatExempt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItemLot" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleItemLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reason" "InventoryAdjustmentReason" NOT NULL DEFAULT 'OTHER',
    "note" TEXT,
    "quantityDelta" INTEGER NOT NULL,
    "lotId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDocument" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "saleId" TEXT,
    "type" "DocumentType" NOT NULL DEFAULT 'BOLETA_ELECTRONICA',
    "folio" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xml" TEXT,
    "xmlSha256" TEXT,
    "totalNet" INTEGER,
    "totalVat" INTEGER,
    "totalGross" INTEGER,
    "siiStatus" "SiiSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "siiTrackId" TEXT,
    "siiMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiiSubmission" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "taxDocumentId" TEXT NOT NULL,
    "status" "SiiSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "trackId" TEXT,
    "requestAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseAt" TIMESTAMP(3),
    "responseRaw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiiSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySalesSummary" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "totalNet" INTEGER NOT NULL DEFAULT 0,
    "totalVat" INTEGER NOT NULL DEFAULT 0,
    "totalGross" INTEGER NOT NULL DEFAULT 0,
    "rvdXml" TEXT,
    "rvdSha256" TEXT,
    "siiStatus" "SiiSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "siiTrackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySalesSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreAlert" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "StoreAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAlert" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ProductAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceSession" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "locale" TEXT NOT NULL DEFAULT 'es-CL',
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceTranscript" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "audioSeconds" INTEGER,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceAction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "VoiceActionType" NOT NULL,
    "status" "VoiceActionStatus" NOT NULL DEFAULT 'PENDING',
    "intentName" TEXT,
    "parametersJson" TEXT,
    "resultJson" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "VoiceAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Store_name_idx" ON "Store"("name");

-- CreateIndex
CREATE INDEX "StoreMember_userId_idx" ON "StoreMember"("userId");

-- CreateIndex
CREATE INDEX "StoreMember_storeId_idx" ON "StoreMember"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreMember_storeId_userId_key" ON "StoreMember"("storeId", "userId");

-- CreateIndex
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- CreateIndex
CREATE INDEX "Product_storeId_name_idx" ON "Product"("storeId", "name");

-- CreateIndex
CREATE INDEX "ProductBarcode_code_idx" ON "ProductBarcode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBarcode_productId_code_key" ON "ProductBarcode"("productId", "code");

-- CreateIndex
CREATE INDEX "Supplier_storeId_idx" ON "Supplier"("storeId");

-- CreateIndex
CREATE INDEX "Supplier_storeId_name_idx" ON "Supplier"("storeId", "name");

-- CreateIndex
CREATE INDEX "Customer_storeId_idx" ON "Customer"("storeId");

-- CreateIndex
CREATE INDEX "Customer_storeId_name_idx" ON "Customer"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CreditAccount_customerId_key" ON "CreditAccount"("customerId");

-- CreateIndex
CREATE INDEX "CreditAccount_storeId_idx" ON "CreditAccount"("storeId");

-- CreateIndex
CREATE INDEX "CreditTransaction_creditAccountId_occurredAt_idx" ON "CreditTransaction"("creditAccountId", "occurredAt");

-- CreateIndex
CREATE INDEX "Purchase_storeId_occurredAt_idx" ON "Purchase"("storeId", "occurredAt");

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseItem_productId_idx" ON "PurchaseItem"("productId");

-- CreateIndex
CREATE INDEX "StockLot_storeId_productId_idx" ON "StockLot"("storeId", "productId");

-- CreateIndex
CREATE INDEX "StockLot_storeId_expiresAt_idx" ON "StockLot"("storeId", "expiresAt");

-- CreateIndex
CREATE INDEX "StockLot_purchaseId_idx" ON "StockLot"("purchaseId");

-- CreateIndex
CREATE INDEX "StockAllocation_storeId_occurredAt_idx" ON "StockAllocation"("storeId", "occurredAt");

-- CreateIndex
CREATE INDEX "StockAllocation_lotId_idx" ON "StockAllocation"("lotId");

-- CreateIndex
CREATE INDEX "StockAllocation_referenceType_referenceId_idx" ON "StockAllocation"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "Sale_storeId_occurredAt_idx" ON "Sale"("storeId", "occurredAt");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");

-- CreateIndex
CREATE INDEX "SaleItemLot_lotId_idx" ON "SaleItemLot"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItemLot_saleItemId_lotId_key" ON "SaleItemLot"("saleItemId", "lotId");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_storeId_occurredAt_idx" ON "InventoryAdjustment"("storeId", "occurredAt");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_productId_idx" ON "InventoryAdjustment"("productId");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_lotId_idx" ON "InventoryAdjustment"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDocument_saleId_key" ON "TaxDocument"("saleId");

-- CreateIndex
CREATE INDEX "TaxDocument_storeId_issuedAt_idx" ON "TaxDocument"("storeId", "issuedAt");

-- CreateIndex
CREATE INDEX "TaxDocument_storeId_siiStatus_idx" ON "TaxDocument"("storeId", "siiStatus");

-- CreateIndex
CREATE INDEX "SiiSubmission_storeId_requestAt_idx" ON "SiiSubmission"("storeId", "requestAt");

-- CreateIndex
CREATE INDEX "SiiSubmission_taxDocumentId_idx" ON "SiiSubmission"("taxDocumentId");

-- CreateIndex
CREATE INDEX "DailySalesSummary_storeId_day_idx" ON "DailySalesSummary"("storeId", "day");

-- CreateIndex
CREATE INDEX "DailySalesSummary_storeId_siiStatus_idx" ON "DailySalesSummary"("storeId", "siiStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DailySalesSummary_storeId_day_key" ON "DailySalesSummary"("storeId", "day");

-- CreateIndex
CREATE INDEX "StoreAlert_storeId_isRead_idx" ON "StoreAlert"("storeId", "isRead");

-- CreateIndex
CREATE INDEX "StoreAlert_storeId_createdAt_idx" ON "StoreAlert"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductAlert_storeId_isActive_idx" ON "ProductAlert"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "ProductAlert_productId_isActive_idx" ON "ProductAlert"("productId", "isActive");

-- CreateIndex
CREATE INDEX "VoiceSession_storeId_startedAt_idx" ON "VoiceSession"("storeId", "startedAt");

-- CreateIndex
CREATE INDEX "VoiceSession_userId_idx" ON "VoiceSession"("userId");

-- CreateIndex
CREATE INDEX "VoiceTranscript_sessionId_createdAt_idx" ON "VoiceTranscript"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "VoiceAction_storeId_createdAt_idx" ON "VoiceAction"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "VoiceAction_sessionId_createdAt_idx" ON "VoiceAction"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "VoiceAction_type_status_idx" ON "VoiceAction"("type", "status");

-- AddForeignKey
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreMember" ADD CONSTRAINT "StoreMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAccount" ADD CONSTRAINT "CreditAccount_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAccount" ADD CONSTRAINT "CreditAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "CreditAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLot" ADD CONSTRAINT "StockLot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLot" ADD CONSTRAINT "StockLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLot" ADD CONSTRAINT "StockLot_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAllocation" ADD CONSTRAINT "StockAllocation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAllocation" ADD CONSTRAINT "StockAllocation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAllocation" ADD CONSTRAINT "StockAllocation_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "StockLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItemLot" ADD CONSTRAINT "SaleItemLot_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItemLot" ADD CONSTRAINT "SaleItemLot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "StockLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "StockLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDocument" ADD CONSTRAINT "TaxDocument_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiiSubmission" ADD CONSTRAINT "SiiSubmission_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiiSubmission" ADD CONSTRAINT "SiiSubmission_taxDocumentId_fkey" FOREIGN KEY ("taxDocumentId") REFERENCES "TaxDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySalesSummary" ADD CONSTRAINT "DailySalesSummary_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreAlert" ADD CONSTRAINT "StoreAlert_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAlert" ADD CONSTRAINT "ProductAlert_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAlert" ADD CONSTRAINT "ProductAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceTranscript" ADD CONSTRAINT "VoiceTranscript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceAction" ADD CONSTRAINT "VoiceAction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceAction" ADD CONSTRAINT "VoiceAction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
