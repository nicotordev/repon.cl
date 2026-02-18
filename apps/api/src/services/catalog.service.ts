import prisma from "../lib/prisma.js";
import { UnitOfMeasure } from "../lib/generated/prisma/client.js";

type OffResponse = {
  product?: {
    product_name?: string;
    product_name_es?: string;
    categories?: string;
    image_url?: string;
  };
};

function normalizeBarcode(raw: string): string {
  const digits = raw.trim().replace(/[^\d]/g, "");
  if (digits.length < 8) throw new Error(`Barcode inválido: "${raw}" -> "${digits}"`);
  return digits;
}

function pickName(p: OffResponse["product"]): string | null {
  const name =
    (p?.product_name_es?.trim() ?? "") || (p?.product_name?.trim() ?? "");
  return name.length > 0 ? name : null;
}

function pickCategory(p: OffResponse["product"]): string | null {
  const c = p?.categories?.trim() ?? "";
  if (c.length === 0) return null;
  return c.split(",")[0]?.trim() ?? null;
}

function pickImageUrl(p: OffResponse["product"]): string | null {
  const u = p?.image_url?.trim() ?? "";
  return u.length > 0 ? u : null;
}

async function fetchOff(barcode: string): Promise<OffResponse> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "repon-catalog/1.0",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `OFF HTTP ${res.status} barcode=${barcode} body=${body.slice(0, 180)}`,
    );
  }

  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null)
    throw new Error("Respuesta OFF inválida");
  return data as OffResponse;
}

export interface CatalogLookupProduct {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  barcodes: string[];
}

/**
 * Ingesta un barcode desde Open Food Facts al catálogo global.
 * Crea Product + ProductBarcode o actualiza el Product existente.
 * Lanza si no está en OFF o no tiene nombre.
 */
export async function ingestBarcodeFromOff(barcodeRaw: string): Promise<{
  created: boolean;
  productId: string;
  name: string;
}> {
  const barcode = normalizeBarcode(barcodeRaw);
  const off = await fetchOff(barcode);
  const p = off.product;

  if (!p) throw new Error(`No encontrado en OFF: ${barcode}`);

  const name = pickName(p);
  if (!name) throw new Error(`Sin nombre en OFF: ${barcode}`);

  const category = pickCategory(p);
  const imageUrl = pickImageUrl(p);

  const existing = await prisma.productBarcode.findUnique({
    where: { code: barcode },
    select: { productId: true },
  });

  if (existing) {
    await prisma.product.update({
      where: { id: existing.productId },
      data: { name, category, imageUrl },
    });
    return { created: false, productId: existing.productId, name };
  }

  const product = await prisma.product.create({
    data: {
      name,
      category,
      imageUrl,
      uom: UnitOfMeasure.UNIT,
      barcodes: { create: { code: barcode } },
    },
  });

  return { created: true, productId: product.id, name };
}

/**
 * Igual que ingestBarcodeFromOff pero no lanza: devuelve { ok: false, reason } en MISS/SKIP.
 * Útil para scripts batch (varios barcodes) donde se quiere loguear y seguir.
 */
export async function ingestBarcodeFromOffSafe(barcodeRaw: string): Promise<
  | { ok: true; created: boolean; productId: string; name: string }
  | { ok: false; reason: "MISS" | "SKIP" }
> {
  const barcode = normalizeBarcode(barcodeRaw);
  let off: OffResponse;
  try {
    off = await fetchOff(barcode);
  } catch {
    return { ok: false, reason: "MISS" };
  }
  const p = off.product;
  if (!p) return { ok: false, reason: "MISS" };
  const name = pickName(p);
  if (!name) return { ok: false, reason: "SKIP" };

  const category = pickCategory(p);
  const imageUrl = pickImageUrl(p);

  const existing = await prisma.productBarcode.findUnique({
    where: { code: barcode },
    select: { productId: true },
  });

  if (existing) {
    await prisma.product.update({
      where: { id: existing.productId },
      data: { name, category, imageUrl },
    });
    return { ok: true, created: false, productId: existing.productId, name };
  }

  const product = await prisma.product.create({
    data: {
      name,
      category,
      imageUrl,
      uom: UnitOfMeasure.UNIT,
      barcodes: { create: { code: barcode } },
    },
  });

  return { ok: true, created: true, productId: product.id, name };
}

/**
 * Busca por barcode en el catálogo; si no existe, ingesta desde OFF y devuelve el producto básico.
 */
export async function lookupByBarcode(barcodeRaw: string): Promise<CatalogLookupProduct | null> {
  const barcode = normalizeBarcode(barcodeRaw);

  let row = await prisma.productBarcode.findUnique({
    where: { code: barcode },
    select: {
      productId: true,
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          imageUrl: true,
          barcodes: { select: { code: true } },
        },
      },
    },
  });

  if (!row) {
    try {
      await ingestBarcodeFromOff(barcode);
    } catch {
      return null;
    }
    row = await prisma.productBarcode.findUnique({
      where: { code: barcode },
      select: {
        productId: true,
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            imageUrl: true,
            barcodes: { select: { code: true } },
          },
        },
      },
    });
  }

  if (!row) return null;

  const { product } = row;
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    imageUrl: product.imageUrl,
    barcodes: product.barcodes.map((b) => b.code),
  };
}

/**
 * Agrega el producto global (por barcode) a la tienda. Crea StoreProduct con imageUrl del Product global.
 */
export async function addProductToStoreByBarcode(input: {
  storeId: string;
  barcode: string;
}): Promise<{ storeProductId: string; productId: string }> {
  const code = normalizeBarcode(input.barcode);

  const barcodeRow = await prisma.productBarcode.findUnique({
    where: { code },
    select: {
      productId: true,
      product: { select: { imageUrl: true } },
    },
  });

  if (!barcodeRow) throw new Error("Producto no existe en catálogo global");

  const sp = await prisma.storeProduct.upsert({
    where: {
      storeId_productId: {
        storeId: input.storeId,
        productId: barcodeRow.productId,
      },
    },
    update: {},
    create: {
      storeId: input.storeId,
      productId: barcodeRow.productId,
      imageUrl: barcodeRow.product.imageUrl,
    },
    select: { id: true, productId: true },
  });

  return { storeProductId: sp.id, productId: sp.productId };
}
