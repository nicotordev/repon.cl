-- Catálogo global: imagen en Product, barcode único global, índice por categoría
-- Nota: Si existen códigos duplicados en ProductBarcode, el UNIQUE en "code" fallará; eliminar duplicados antes.

-- Product: imagen global (puede no existir si migración previa la borró)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Product: índice por categoría para búsquedas
CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category");

-- ProductBarcode: reemplazar unique (productId, code) por unique (code) global
DROP INDEX IF EXISTS "ProductBarcode_productId_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ProductBarcode_code_key" ON "ProductBarcode"("code");
