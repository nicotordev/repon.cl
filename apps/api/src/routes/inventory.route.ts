import { Hono } from "hono";
import { getAuth } from "@hono/clerk-auth";
import inventoryService from "../services/inventory.service.js";
import { resolveStoreForUser } from "../services/store.service.js";
import { z } from "zod";

const app = new Hono();

// Helper to get storeId from context
async function getStore(c: any) {
  const session = await getAuth(c);
  if (!session || !session.userId) return null;
  const storeId = c.req.header("x-store-id");
  return await resolveStoreForUser(session.userId, storeId || null);
}

app.get("/", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const query = c.req.query("q");
  if (query) {
    const products = await inventoryService.searchProducts(store.id, query);
    return c.json(products);
  }

  const products = await inventoryService.getProducts(store.id);
  return c.json(products);
});

app.get("/lots", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const lots = await inventoryService.getLots(store.id);
  return c.json(lots);
});

app.get("/adjustments", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const adjustments = await inventoryService.getAdjustments(store.id);
  return c.json(adjustments);
});

app.get("/:id", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const productId = c.req.param("id");
  const product = await inventoryService.getProduct(store.id, productId);
  if (!product) return c.json({ error: "Product not found" }, 404);

  return c.json(product);
});

const CreateProductSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  uom: z.enum(["UNIT", "GRAM", "KILOGRAM", "MILLILITER", "LITER"]).optional(),
  salePriceGross: z.number().int().positive().optional(),
  isPerishable: z.boolean().optional(),
  defaultShelfLifeDays: z.number().int().positive().optional(),
  initialStock: z.number().optional(),
  initialUnitCostGross: z.number().optional(),
  barcode: z.string().optional(),
});

app.post("/", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const body = await c.req.json();
  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid input", details: parsed.error }, 400);

  const product = await inventoryService.createProduct(store.id, parsed.data);
  return c.json(product, 201);
});

const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  uom: z.enum(["UNIT", "GRAM", "KILOGRAM", "MILLILITER", "LITER"]).optional(),
  salePriceGross: z.number().int().positive().optional(),
  isPerishable: z.boolean().optional(),
  defaultShelfLifeDays: z.number().int().positive().optional(),
});

app.patch("/:id", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const productId = c.req.param("id");
  const body = await c.req.json();
  const parsed = UpdateProductSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid input", details: parsed.error }, 400);

  try {
    const product = await inventoryService.updateProduct(store.id, productId, parsed.data);
    return c.json(product);
  } catch (err) {
    return c.json({ error: "Failed to update product" }, 500);
  }
});

const AdjustStockSchema = z.object({
  quantityDelta: z.number(),
  reason: z.enum(["COUNT_CORRECTION", "DAMAGE", "EXPIRED", "THEFT", "TRANSFER_OUT", "TRANSFER_IN", "OTHER"]),
  note: z.string().optional(),
});

app.post("/:id/adjust", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const productId = c.req.param("id");
  const body = await c.req.json();
  const parsed = AdjustStockSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid input", details: parsed.error }, 400);

  try {
    const adjustment = await inventoryService.adjustStock(store.id, productId, parsed.data);
    return c.json(adjustment);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to adjust stock" }, 500);
  }
});

export default app;
