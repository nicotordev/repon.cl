import { Hono } from "hono";
import { getAuth } from "@hono/clerk-auth";
import inventoryService from "../services/inventory.service.js";
import {
  resolveStoreForUser,
  resolveUserByClerkId,
} from "../services/store.service.js";
import {
  uploadProductImage,
  isR2Configured,
  isAcceptedImageType,
  getMaxFileBytes,
  deleteByPublicUrl,
  R2UploadError,
} from "../services/r2.service.js";
import prisma from "../lib/prisma.js";
import { Prisma } from "../lib/generated/prisma/client.js";
import { z } from "zod";

const app = new Hono();

// Helper to get storeId from context
async function getStore(c: any) {
  const session = await getAuth(c);
  if (!session || !session.userId) return null;
  const user = await resolveUserByClerkId(session.userId);
  if (!user) return null;
  const storeId = c.req.header("x-store-id");
  return await resolveStoreForUser(user, storeId || null);
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

app.get("/catalog", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const query = c.req.query("q");
  if (!query || query.trim().length < 2) {
    return c.json([]);
  }
  const rows = await inventoryService.searchCatalog(store.id, query.trim());
  return c.json(rows);
});

const AddProductToStoreSchema = z.object({
  productId: z.string().min(1),
  salePriceGross: z.number().int().positive().optional(),
  isPerishable: z.boolean().optional(),
  defaultShelfLifeDays: z.number().int().positive().optional(),
  initialStock: z.number().int().min(0).optional(),
  initialUnitCostGross: z.number().int().optional(),
});

app.post("/catalog/add", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const body = await c.req.json();
  const parsed = AddProductToStoreSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error }, 400);
  }
  try {
    const product = await inventoryService.addProductToStore(store.id, parsed.data);
    return c.json(product, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al agregar producto";
    if (message.includes("ya está en tu tienda")) {
      return c.json({ error: message }, 409);
    }
    if (message.includes("not found")) {
      return c.json({ error: "Producto no encontrado" }, 404);
    }
    return c.json({ error: message }, 500);
  }
});

app.delete("/:id", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const productId = c.req.param("id");

  try {
    const removed = await inventoryService.removeProductFromStore(
      store.id,
      productId,
    );
    if (removed === null) {
      return c.json({ error: "Producto no encontrado en tu tienda" }, 404);
    }
    return c.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return c.json(
          { error: "Producto no encontrado en tu tienda" },
          404,
        );
      }
      if (err.code === "P2003") {
        return c.json(
          {
            error:
              "No se puede quitar el producto: tiene movimientos asociados (stock, ventas o compras).",
          },
          400,
        );
      }
    }
    console.error("[inventory.route] remove product from store failed:", err);
    return c.json(
      { error: "Error al quitar el producto de la tienda" },
      500,
    );
  }
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
  imageUrl: z.string().url().nullable().optional(),
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

function inferImageType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

/**
 * POST /inventory/:id/image – Upload product image (multipart). Requires R2 configured.
 */
app.post("/:id/image", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  if (!isR2Configured()) {
    return c.json(
      { error: "Subida de imágenes no configurada (R2). Contacta al administrador." },
      503
    );
  }

  const productId = c.req.param("id");
  const sp = await prisma.storeProduct.findFirst({
    where: { productId, storeId: store.id },
    select: { productId: true, imageUrl: true },
  });
  if (!sp) return c.json({ error: "Product not found" }, 404);
  const product = { id: sp.productId, imageUrl: sp.imageUrl };

  let body: Record<string, unknown>;
  try {
    body = (await c.req.parseBody()) as Record<string, unknown>;
  } catch (e) {
    console.error("[inventory.route] parseBody failed:", e);
    return c.json({ error: "Cuerpo multipart inválido" }, 400);
  }

  const file = body["file"];
  if (!file || typeof file === "string") {
    return c.json({ error: "Falta el campo 'file' o no es un archivo" }, 400);
  }

  const raw = file as Blob & { type?: string; name?: string };
  const size = raw.size ?? (raw as unknown as { length?: number }).length;
  if (!size || size === 0) {
    return c.json({ error: "El archivo está vacío" }, 400);
  }
  if (size > getMaxFileBytes()) {
    return c.json(
      { error: `Tamaño máximo ${Math.round(getMaxFileBytes() / 1024 / 1024)} MB` },
      400
    );
  }

  let type = (raw.type ?? "").trim();
  const name =
    typeof (raw as unknown as { name?: string }).name === "string"
      ? (raw as unknown as { name: string }).name
      : "image";
  if (!type) type = inferImageType(name);
  if (!isAcceptedImageType(type)) {
    return c.json(
      { error: "Formato no válido. Usa JPEG, PNG, WebP o GIF." },
      400
    );
  }

  const arrayBuffer =
    typeof (raw as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function"
      ? await (raw as Blob).arrayBuffer()
      : null;
  if (!arrayBuffer) {
    return c.json({ error: "No se pudo leer el archivo" }, 400);
  }
  const buffer = Buffer.from(arrayBuffer);

  let imageUrl: string;
  try {
    imageUrl = await uploadProductImage({
      storeId: store.id,
      productId: product.id,
      buffer,
      contentType: type,
      originalFilename: name,
    });
  } catch (err) {
    if (err instanceof R2UploadError) {
      return c.json({ error: err.message, code: err.code }, err.status as 503 | 502);
    }
    console.error("[inventory.route] upload image failed:", err);
    return c.json(
      { error: "Error al subir la imagen. Intenta de nuevo." },
      500,
    );
  }

  // Opcional: borrar imagen anterior en R2 si era nuestra
  if (product.imageUrl) {
    await deleteByPublicUrl(product.imageUrl);
  }

  const updated = await inventoryService.updateProduct(store.id, productId, {
    imageUrl,
  });
  return c.json(updated);
});

/**
 * DELETE /inventory/:id/image – Remove product image (DB + R2).
 */
app.delete("/:id/image", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const productId = c.req.param("id");
  const sp = await prisma.storeProduct.findFirst({
    where: { productId, storeId: store.id },
    select: { productId: true, imageUrl: true },
  });
  if (!sp) return c.json({ error: "Product not found" }, 404);

  if (sp.imageUrl) {
    await deleteByPublicUrl(sp.imageUrl);
  }

  await inventoryService.updateProduct(store.id, productId, { imageUrl: null });
  const updated = await inventoryService.getProduct(store.id, productId);
  return c.json(updated);
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
