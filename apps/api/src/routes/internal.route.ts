import { Hono } from "hono";
import { z } from "zod";
import inventoryService from "../services/inventory.service.js";
const app = new Hono();

function getServiceKey(c: { req: { header: (n: string) => string | undefined } }) {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

const ImportProductSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  salePriceGross: z.number().int().min(0).optional(),
  barcode: z.string().optional(),
});

const ImportBodySchema = z.object({
  storeId: z.string().cuid(),
  products: z.array(ImportProductSchema).min(1).max(500),
});

app.post("/import-products", async (c) => {
  const key = getServiceKey(c);
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || key !== expected) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const parsed = ImportBodySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  const { storeId, products } = parsed.data;
  const results: { name: string; id?: string; error?: string }[] = [];
  for (const p of products) {
    try {
      const created = await inventoryService.createProduct(storeId, { name: p.name, brand: p.brand, category: p.category, salePriceGross: p.salePriceGross, barcode: p.barcode });
      results.push({ name: p.name, id: created.id });
    } catch (err) { results.push({ name: p.name, error: err instanceof Error ? err.message : "Error" }); }
  }
  return c.json({ created: results.filter(r => r.id).length, failed: results.filter(r => r.error).length, total: products.length, results });
});

export default app;
