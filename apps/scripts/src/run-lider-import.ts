import { scrapeLiderCategory, type LiderScrapedProduct } from "./lider-scraper.js";

const API_URL = process.env.API_URL ?? "";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";
const STORE_ID = process.env.STORE_ID ?? "";

export async function runLiderScrapeAndImport(options: {
  categoryPath?: string;
  maxPages?: number;
  dryRun?: boolean;
}): Promise<{ scraped: number; imported: number; failed: number; errors: string[] }> {
  const { categoryPath = "/supermercado/category/", maxPages = 2, dryRun = false } = options;

  console.log("[Lider] Scrapeando categoría:", categoryPath, "maxPages:", maxPages);

  const products = await scrapeLiderCategory({
    categoryPath,
    maxPages,
    delayMs: 2000,
  });

  console.log("[Lider] Productos scrapeados:", products.length);
  if (products.length === 0) {
    return { scraped: 0, imported: 0, failed: 0, errors: ["No se encontraron productos (¿cambió la página o hay bloqueo?)"] };
  }

  if (dryRun) {
    products.slice(0, 5).forEach((p) => console.log("  -", p.name, p.priceGross ? "$" + p.priceGross : ""));
    if (products.length > 5) console.log("  ... y", products.length - 5, "más");
    return { scraped: products.length, imported: 0, failed: 0, errors: [] };
  }

  if (!API_URL || !INTERNAL_API_KEY || !STORE_ID) {
    console.warn("[Lider] Faltan API_URL, INTERNAL_API_KEY o STORE_ID. Guardando en lider-products.json");
    const fs = await import("node:fs/promises");
    const payload = products.map((p) => ({
      name: p.name,
      brand: p.brand ?? undefined,
      category: p.category ?? undefined,
      salePriceGross: p.priceGross ?? undefined,
      barcode: p.sku ?? undefined,
    }));
    await fs.writeFile(
      "lider-products.json",
      JSON.stringify({ storeId: STORE_ID || "REQUERIDO", products: payload }, null, 2),
      "utf-8"
    );
    console.log("[Lider] Guardado lider-products.json. Configura API_URL, INTERNAL_API_KEY y STORE_ID para importar directo.");
    return { scraped: products.length, imported: 0, failed: 0, errors: [] };
  }

  const payload = products.map((p: LiderScrapedProduct) => ({
    name: p.name,
    brand: p.brand ?? undefined,
    category: p.category ?? undefined,
    salePriceGross: p.priceGross ?? undefined,
    barcode: p.sku ?? undefined,
  }));

  const base = API_URL.replace(/\/$/, "");
  const res = await fetch(base + "/internal/import-products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + INTERNAL_API_KEY,
    },
    body: JSON.stringify({ storeId: STORE_ID, products: payload }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      scraped: products.length,
      imported: 0,
      failed: products.length,
      errors: ["HTTP " + res.status + ": " + text.slice(0, 200)],
    };
  }

  const data = await res.json() as { created: number; failed: number; results?: { name: string; error?: string }[] };
  const errors = (data.results ?? []).filter((r) => r.error).map((r) => r.name + ": " + r.error);
  console.log("[Lider] Importados:", data.created, "Fallidos:", data.failed);
  return { scraped: products.length, imported: data.created, failed: data.failed, errors };
}
