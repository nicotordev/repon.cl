/* eslint-disable no-console */
/**
 * Ingesta mínima desde Open Food Facts al catálogo global (Product + ProductBarcode).
 * Campos: barcode, name, category, imageUrl. Cada tienda "adopta" vía StoreProduct (precio, etc.).
 *
 * Uso:
 *   pnpm run ingest:off <BARCODE>           # un barcode
 *   pnpm run ingest:off <BARCODE1> <BARCODE2> ...  # varios (batch; MISS/SKIP no abortan)
 */
import "dotenv/config";
import prisma from "../src/lib/prisma.js";
import { ingestBarcodeFromOffSafe } from "../src/services/catalog.service.js";

async function main(): Promise<void> {
  const barcodes = process.argv.slice(2).filter((s) => s.trim().length > 0);
  if (barcodes.length === 0) {
    console.error("Uso: pnpm run ingest:off <BARCODE> [BARCODE2 ...]");
    process.exit(1);
  }

  try {
    for (const raw of barcodes) {
      const result = await ingestBarcodeFromOffSafe(raw);
      if (!result.ok) {
        const reason = (result as { ok: false; reason: "MISS" | "SKIP" }).reason;
        if (reason === "MISS") {
          console.warn(`[MISS] No encontrado en OFF: ${raw}`);
        } else {
          console.warn(`[SKIP] Sin nombre en OFF: ${raw}`);
        }
      } else {
        if (result.created) {
          console.log(`[CREATE] ${raw} -> "${result.name}"`);
        } else {
          console.log(`[UPDATE] ${raw} -> ${result.productId}`);
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
