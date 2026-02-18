import { Hono } from "hono";
import { getAuth } from "@hono/clerk-auth";
import { z } from "zod";
import {
  lookupByBarcode,
  addProductToStoreByBarcode,
} from "../services/catalog.service.js";
import { resolveCatalogQuery } from "../services/catalog-resolver.service.js";
import {
  resolveStoreForUser,
  resolveUserByClerkId,
} from "../services/store.service.js";
import inventoryService from "../services/inventory.service.js";
import prisma from "../lib/prisma.js";
import { StockLotSource } from "../lib/generated/prisma/client.js";

const app = new Hono();

async function getStore(c: any) {
  const session = await getAuth(c);
  if (!session?.userId) return null;
  const user = await resolveUserByClerkId(session.userId);
  if (!user) return null;
  const storeId = c.req.header("x-store-id");
  return await resolveStoreForUser(user, storeId || null);
}

const LookupSchema = z.object({
  barcode: z.string().min(1),
});

/** GET /catalog/resolve?q=... or POST /catalog/resolve { "query": "..." } — Resuelve búsqueda a candidatos para catálogo (OFF + ML fallback). */
app.get("/resolve", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const q = c.req.query("q")?.trim();
  if (!q) return c.json({ error: "Missing query param 'q'" }, 400);

  try {
    const result = await resolveCatalogQuery(q);
    return c.json(result);
  } catch (err) {
    console.error("[catalog.route] resolve failed:", err);
    return c.json({ error: "Error resolving catalog query" }, 500);
  }
});

const ResolveSchema = z.object({
  query: z.string().min(1),
});

app.post("/resolve", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const body = await c.req.json().catch(() => ({}));
  const parsed = ResolveSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error }, 400);
  }

  try {
    const result = await resolveCatalogQuery(parsed.data.query);
    return c.json(result);
  } catch (err) {
    console.error("[catalog.route] resolve failed:", err);
    return c.json({ error: "Error resolving catalog query" }, 500);
  }
});

/** POST /catalog/lookup — Busca por barcode; si no existe, ingesta desde OFF y devuelve producto básico. */
app.post("/lookup", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const body = await c.req.json().catch(() => ({}));
  const parsed = LookupSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error }, 400);
  }

  try {
    const product = await lookupByBarcode(parsed.data.barcode);
    if (!product) {
      return c.json(
        { error: "No encontrado en catálogo ni en Open Food Facts" },
        404,
      );
    }
    return c.json(product);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Barcode inválido")) {
      return c.json({ error: msg }, 400);
    }
    console.error("[catalog.route] lookup failed:", err);
    return c.json({ error: "Error al buscar producto" }, 500);
  }
});

const AddByBarcodeSchema = z.object({
  barcode: z.string().min(1),
  salePriceGross: z.number().int().positive().optional(),
  isPerishable: z.boolean().optional(),
  defaultShelfLifeDays: z.number().int().positive().optional(),
  initialStock: z.number().int().min(0).optional(),
  initialUnitCostGross: z.number().int().optional(),
});

/** POST /catalog/add-by-barcode — Agrega producto global a la tienda por barcode (crea StoreProduct). */
app.post("/add-by-barcode", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const body = await c.req.json().catch(() => ({}));
  const parsed = AddByBarcodeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error }, 400);
  }

  try {
    const { productId } = await addProductToStoreByBarcode({
      storeId: store.id,
      barcode: parsed.data.barcode,
    });

    if (
      parsed.data.salePriceGross !== undefined ||
      parsed.data.isPerishable !== undefined ||
      parsed.data.defaultShelfLifeDays !== undefined
    ) {
      await inventoryService.updateProduct(store.id, productId, {
        salePriceGross: parsed.data.salePriceGross,
        isPerishable: parsed.data.isPerishable,
        defaultShelfLifeDays: parsed.data.defaultShelfLifeDays,
      });
    }
    if (parsed.data.initialStock !== undefined && parsed.data.initialStock > 0) {
      await prisma.stockLot.create({
        data: {
          storeId: store.id,
          productId,
          quantityIn: parsed.data.initialStock,
          unitCostGross: parsed.data.initialUnitCostGross,
          source: StockLotSource.MANUAL,
        },
      });
    }

    const product = await inventoryService.getProduct(store.id, productId);
    return c.json(product, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Barcode inválido")) {
      return c.json({ error: msg }, 400);
    }
    if (msg.includes("no existe en catálogo global")) {
      return c.json({ error: msg }, 404);
    }
    console.error("[catalog.route] add-by-barcode failed:", err);
    return c.json({ error: "Error al agregar producto a la tienda" }, 500);
  }
});

export default app;
