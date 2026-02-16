import { z } from "zod";
import {
  InventoryAdjustmentReason,
  PaymentMethod,
  StockLotSource,
  UnitOfMeasure,
} from "../../lib/generated/prisma/client.js";
import prisma from "../../lib/prisma.js";

export const AddStockParamsSchema = z.object({
  product: z.string().min(1),
  quantity: z.number().int().positive(),
  expiresAt: z.string().datetime().optional(),
  unitCostGross: z.number().int().positive().optional(),
});

export type AddStockParams = z.infer<typeof AddStockParamsSchema>;

export const SetPriceParamsSchema = z.object({
  product: z.string().min(1),
  salePriceGross: z.number().int().positive(),
});

export type SetPriceParams = z.infer<typeof SetPriceParamsSchema>;

export const MarkExpiredParamsSchema = z.object({
  product: z.string().min(1),
  quantity: z.number().int().positive().optional(),
});

export type MarkExpiredParams = z.infer<typeof MarkExpiredParamsSchema>;

export const AskMetricParamsSchema = z.object({
  metric: z.enum([
    "stock_total",
    "stock_by_product",
    "sales_today",
    "sales_range",
    "expiring_soon",
  ]),
  product: z.string().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type AskMetricParams = z.infer<typeof AskMetricParamsSchema>;

const UomSchema = z.enum([
  UnitOfMeasure.UNIT,
  UnitOfMeasure.GRAM,
  UnitOfMeasure.KILOGRAM,
  UnitOfMeasure.MILLILITER,
  UnitOfMeasure.LITER,
]);

export const CreateProductParamsSchema = z.object({
  name: z.string().min(1),
  salePriceGross: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  uom: UomSchema.optional(),
});
export type CreateProductParams = z.infer<typeof CreateProductParamsSchema>;

export const ListProductsParamsSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type ListProductsParams = z.infer<typeof ListProductsParamsSchema>;

export const GetProductParamsSchema = z.object({ product: z.string().min(1) });
export type GetProductParams = z.infer<typeof GetProductParamsSchema>;

export const UpdateProductParamsSchema = z.object({
  product: z.string().min(1),
  name: z.string().min(1).optional(),
  salePriceGross: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
});
export type UpdateProductParams = z.infer<typeof UpdateProductParamsSchema>;

export const ListStockLotsParamsSchema = z.object({
  product: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type ListStockLotsParams = z.infer<typeof ListStockLotsParamsSchema>;

export const ListSalesParamsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type ListSalesParams = z.infer<typeof ListSalesParamsSchema>;

export const ListPurchasesParamsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type ListPurchasesParams = z.infer<typeof ListPurchasesParamsSchema>;

export const ListSuppliersParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});
export type ListSuppliersParams = z.infer<typeof ListSuppliersParamsSchema>;

export const ListCustomersParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});
export type ListCustomersParams = z.infer<typeof ListCustomersParamsSchema>;

export const AdjustStockParamsSchema = z.object({
  product: z.string().min(1),
  quantityDelta: z.number().int(), // positivo = suma, negativo = resta
  reason: z.enum([
    "COUNT_CORRECTION",
    "DAMAGE",
    "EXPIRED",
    "THEFT",
    "TRANSFER_OUT",
    "TRANSFER_IN",
    "OTHER",
  ]),
  note: z.string().optional(),
});
export type AdjustStockParams = z.infer<typeof AdjustStockParamsSchema>;

export const CreateSaleItemSchema = z.object({
  product: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceGross: z.number().int().nonnegative().optional(),
});
export const CreateSaleParamsSchema = z.object({
  items: z.array(CreateSaleItemSchema).min(1),
  paymentMethod: z
    .enum(["CASH", "DEBIT", "CREDIT", "TRANSFER", "OTHER"])
    .optional(),
  customerId: z.string().optional(),
});
export type CreateSaleParams = z.infer<typeof CreateSaleParamsSchema>;

export const CreatePurchaseItemSchema = z.object({
  product: z.string().min(1),
  quantity: z.number().int().positive(),
  unitCostGross: z.number().int().nonnegative().optional(),
});
export const CreatePurchaseParamsSchema = z.object({
  items: z.array(CreatePurchaseItemSchema).min(1),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});
export type CreatePurchaseParams = z.infer<typeof CreatePurchaseParamsSchema>;

export const CreateSupplierParamsSchema = z.object({
  name: z.string().min(1),
  rut: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});
export type CreateSupplierParams = z.infer<typeof CreateSupplierParamsSchema>;

export const CreateCustomerParamsSchema = z.object({
  name: z.string().min(1),
  rut: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});
export type CreateCustomerParams = z.infer<typeof CreateCustomerParamsSchema>;

export const CreateProductAlertParamsSchema = z.object({
  product: z.string().min(1),
  type: z.string().min(1),
  message: z.string().min(1),
});
export type CreateProductAlertParams = z.infer<
  typeof CreateProductAlertParamsSchema
>;

export type ActionExecutionResult =
  | { ok: true; message: string; data?: unknown }
  | { ok: false; message: string };

async function findProductByNameOrBarcode(storeId: string, query: string) {
  const q = query.trim();
  if (q.length === 0) return null;

  const byBarcode = await prisma.productBarcode.findFirst({
    where: {
      code: q,
      product: { storeId },
    },
    include: {
      product: true,
    },
  });

  if (byBarcode?.product) return byBarcode.product;

  const byName = await prisma.product.findFirst({
    where: {
      storeId,
      name: { equals: q, mode: "insensitive" },
    },
  });

  if (byName) return byName;

  const byContains = await prisma.product.findFirst({
    where: {
      storeId,
      name: { contains: q, mode: "insensitive" },
    },
    orderBy: { updatedAt: "desc" },
  });

  return byContains;
}

export async function executeAddStock(
  storeId: string,
  params: AddStockParams,
): Promise<ActionExecutionResult> {
  const product = await findProductByNameOrBarcode(storeId, params.product);
  if (!product) {
    return {
      ok: false,
      message: `No encontré el producto "${params.product}".`,
    };
  }

  const expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;

  const lot = await prisma.stockLot.create({
    data: {
      storeId,
      productId: product.id,
      source: "MANUAL",
      quantityIn: params.quantity,
      unitCostGross: params.unitCostGross ?? null,
      expiresAt,
    },
  });

  return {
    ok: true,
    message: `Listo ✅ Agregué ${params.quantity} unidades a "${product.name}".`,
    data: { lotId: lot.id, productId: product.id },
  };
}

export async function executeSetPrice(
  storeId: string,
  params: SetPriceParams,
): Promise<ActionExecutionResult> {
  const product = await findProductByNameOrBarcode(storeId, params.product);
  if (!product) {
    return {
      ok: false,
      message: `No encontré el producto "${params.product}".`,
    };
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { salePriceGross: params.salePriceGross },
  });

  return {
    ok: true,
    message: `Listo ✅ Precio de "${product.name}" actualizado a $${params.salePriceGross.toLocaleString("es-CL")} CLP.`,
    data: { productId: product.id },
  };
}

export async function executeMarkExpired(
  storeId: string,
  params: MarkExpiredParams,
): Promise<ActionExecutionResult> {
  const product = await findProductByNameOrBarcode(storeId, params.product);
  if (!product) {
    return {
      ok: false,
      message: `No encontré el producto "${params.product}".`,
    };
  }

  const lots = await prisma.stockLot.findMany({
    where: {
      storeId,
      productId: product.id,
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
  });

  const available = lots
    .map((l) => ({ lot: l, available: l.quantityIn - l.quantityOut }))
    .filter((x) => x.available > 0);

  if (available.length === 0) {
    return {
      ok: false,
      message: `No hay stock disponible para marcar vencido en "${product.name}".`,
    };
  }

  const toExpire =
    params.quantity ?? available.reduce((acc, x) => acc + x.available, 0);
  let remaining = toExpire;

  const allocations: Array<{ lotId: string; quantity: number }> = [];

  for (const x of available) {
    if (remaining <= 0) break;
    const qty = Math.min(remaining, x.available);
    remaining -= qty;
    allocations.push({ lotId: x.lot.id, quantity: qty });
  }

  const expiredQty = toExpire - remaining;
  if (expiredQty <= 0) {
    return {
      ok: false,
      message: `No pude determinar cantidad vencida para "${product.name}".`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventoryAdjustment.create({
      data: {
        storeId,
        productId: product.id,
        reason: InventoryAdjustmentReason.EXPIRED,
        quantityDelta: -expiredQty,
        note: "Marcado como vencido vía voz",
      },
    });

    for (const a of allocations) {
      await tx.stockLot.update({
        where: { id: a.lotId },
        data: { quantityOut: { increment: a.quantity } },
      });
      await tx.stockAllocation.create({
        data: {
          storeId,
          productId: product.id,
          lotId: a.lotId,
          quantity: a.quantity,
          referenceType: "INVENTORY_ADJUSTMENT",
          referenceId: null,
        },
      });
    }
  });

  return {
    ok: true,
    message: `Listo ✅ Marqué ${expiredQty} unidades como vencidas para "${product.name}".`,
    data: { productId: product.id, expiredQty },
  };
}

export async function executeAskMetric(
  storeId: string,
  params: AskMetricParams,
): Promise<ActionExecutionResult> {
  const metric = params.metric;

  if (metric === "stock_total") {
    const rows = await prisma.stockLot.findMany({
      where: { storeId },
      select: { quantityIn: true, quantityOut: true },
    });
    const total = rows.reduce(
      (acc, r) => acc + (r.quantityIn - r.quantityOut),
      0,
    );
    return {
      ok: true,
      message: `Stock total: ${total} unidades.`,
      data: { total },
    };
  }

  if (metric === "stock_by_product") {
    if (!params.product) {
      return { ok: false, message: 'Falta "product" para stock_by_product.' };
    }
    const product = await findProductByNameOrBarcode(storeId, params.product);
    if (!product)
      return {
        ok: false,
        message: `No encontré el producto "${params.product}".`,
      };

    const rows = await prisma.stockLot.findMany({
      where: { storeId, productId: product.id },
      select: { quantityIn: true, quantityOut: true },
    });
    const total = rows.reduce(
      (acc, r) => acc + (r.quantityIn - r.quantityOut),
      0,
    );
    return {
      ok: true,
      message: `Stock de "${product.name}": ${total} unidades.`,
      data: { productId: product.id, total },
    };
  }

  if (metric === "sales_today") {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
      where: { storeId, occurredAt: { gte: start, lte: end } },
      select: { totalGross: true },
    });

    const totalGross = sales.reduce((acc, s) => acc + (s.totalGross ?? 0), 0);
    return {
      ok: true,
      message: `Ventas de hoy: $${totalGross.toLocaleString("es-CL")} CLP (${sales.length} ventas).`,
      data: { count: sales.length, totalGross },
    };
  }

  if (metric === "sales_range") {
    const fromStr = params.from;
    const toStr = params.to;
    if (!fromStr || !toStr) {
      return {
        ok: false,
        message: 'Faltan "from" y "to" (datetime ISO) para sales_range.',
      };
    }
    const from = new Date(fromStr);
    const to = new Date(toStr);

    const sales = await prisma.sale.findMany({
      where: { storeId, occurredAt: { gte: from, lte: to } },
      select: { totalGross: true },
    });

    const totalGross = sales.reduce((acc, s) => acc + (s.totalGross ?? 0), 0);
    return {
      ok: true,
      message: `Ventas: $${totalGross.toLocaleString("es-CL")} CLP (${sales.length} ventas) en el rango.`,
      data: {
        count: sales.length,
        totalGross,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    };
  }

  if (metric === "expiring_soon") {
    const now = new Date();
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);

    const lots = await prisma.stockLot.findMany({
      where: {
        storeId,
        expiresAt: { gte: now, lte: in7 },
      },
      include: { product: { select: { name: true } } },
      orderBy: [{ expiresAt: "asc" }],
      take: 10,
    });

    if (lots.length === 0) {
      return {
        ok: true,
        message: "No veo productos por vencer en los próximos 7 días.",
        data: { count: 0 },
      };
    }

    const lines = lots.map((l) => {
      const available = l.quantityIn - l.quantityOut;
      const date = l.expiresAt
        ? l.expiresAt.toISOString().slice(0, 10)
        : "sin fecha";
      return `• ${l.product.name}: ${available} u. (vence ${date})`;
    });

    return {
      ok: true,
      message: `Por vencer (7 días):\n${lines.join("\n")}`,
      data: { count: lots.length },
    };
  }

  return { ok: false, message: `Métrica no soportada: ${metric}` };
}

// --- Productos (siempre filtrados por storeId) ---

export async function executeCreateProduct(
  storeId: string,
  params: CreateProductParams,
): Promise<ActionExecutionResult> {
  const product = await prisma.product.create({
    data: {
      storeId,
      name: params.name.trim(),
      salePriceGross: params.salePriceGross ?? null,
      category: params.category?.trim() || null,
      brand: params.brand?.trim() || null,
      uom: params.uom ?? UnitOfMeasure.UNIT,
    },
  });
  return {
    ok: true,
    message: `Producto "${product.name}" creado.`,
    data: { productId: product.id },
  };
}

export async function executeListProducts(
  storeId: string,
  params: ListProductsParams,
): Promise<ActionExecutionResult> {
  const limit = params.limit ?? 20;
  const where = { storeId } as {
    storeId: string;
    name?: { contains: string; mode: "insensitive" };
  };
  if (params.query?.trim()) {
    where.name = { contains: params.query.trim(), mode: "insensitive" };
  }
  const products = await prisma.product.findMany({
    where,
    select: { id: true, name: true, salePriceGross: true, category: true },
    orderBy: { name: "asc" },
    take: limit,
  });
  const lines = products.map(
    (p) =>
      `• ${p.name}${p.salePriceGross != null ? ` $${p.salePriceGross}` : ""}`,
  );
  return {
    ok: true,
    message: lines.length ? lines.join("\n") : "No hay productos.",
    data: { count: products.length },
  };
}

export async function executeGetProduct(
  storeId: string,
  params: GetProductParams,
): Promise<ActionExecutionResult> {
  const product = await findProductByNameOrBarcode(storeId, params.product);
  if (!product) {
    return {
      ok: false,
      message: `No encontré el producto "${params.product}".`,
    };
  }
  const lots = await prisma.stockLot.findMany({
    where: { storeId, productId: product.id },
    select: { quantityIn: true, quantityOut: true },
  });
  const stock = lots.reduce(
    (acc, l) => acc + (l.quantityIn - l.quantityOut),
    0,
  );
  return {
    ok: true,
    message: `${product.name}: precio $${product.salePriceGross ?? "—"} CLP, stock ${stock} u.`,
    data: { productId: product.id, stock },
  };
}

export async function executeUpdateProduct(
  storeId: string,
  params: UpdateProductParams,
): Promise<ActionExecutionResult> {
  const product = await findProductByNameOrBarcode(storeId, params.product);
  if (!product) {
    return {
      ok: false,
      message: `No encontré el producto "${params.product}".`,
    };
  }
  const data: {
    name?: string;
    salePriceGross?: number | null;
    category?: string | null;
    brand?: string | null;
  } = {};
  if (params.name != null) data.name = params.name.trim();
  if (params.salePriceGross != null)
    data.salePriceGross = params.salePriceGross;
  if (params.category !== undefined)
    data.category = params.category?.trim() || null;
  if (params.brand !== undefined) data.brand = params.brand?.trim() || null;
  await prisma.product.update({ where: { id: product.id }, data });
  return {
    ok: true,
    message: `Producto "${product.name}" actualizado.`,
    data: { productId: product.id },
  };
}

export async function executeListStockLots(
  storeId: string,
  params: ListStockLotsParams,
): Promise<ActionExecutionResult> {
  const limit = params.limit ?? 20;
  const where = { storeId } as { storeId: string; productId?: string };
  if (params.product?.trim()) {
    const p = await findProductByNameOrBarcode(storeId, params.product);
    if (!p)
      return {
        ok: false,
        message: `No encontré el producto "${params.product}".`,
      };
    where.productId = p.id;
  }
  const lots = await prisma.stockLot.findMany({
    where,
    include: { product: { select: { name: true } } },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
  const lines = lots.map((l) => {
    const avail = l.quantityIn - l.quantityOut;
    const exp = l.expiresAt ? l.expiresAt.toISOString().slice(0, 10) : "—";
    return `• ${l.product.name}: ${avail} u., vence ${exp}`;
  });
  return {
    ok: true,
    message: lines.length ? lines.join("\n") : "No hay lotes.",
    data: { count: lots.length },
  };
}

export async function executeListSales(
  storeId: string,
  params: ListSalesParams,
): Promise<ActionExecutionResult> {
  const limit = params.limit ?? 20;
  const where = { storeId } as {
    storeId: string;
    occurredAt?: { gte: Date; lte: Date };
  };
  if (params.from && params.to) {
    where.occurredAt = { gte: new Date(params.from), lte: new Date(params.to) };
  }
  const sales = await prisma.sale.findMany({
    where,
    select: { id: true, occurredAt: true, totalGross: true },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
  const total = sales.reduce((acc, s) => acc + (s.totalGross ?? 0), 0);
  const lines = sales.map(
    (s) =>
      `• ${s.occurredAt.toISOString().slice(0, 10)} $${s.totalGross ?? 0} CLP`,
  );
  return {
    ok: true,
    message: lines.length
      ? `${lines.join("\n")}\nTotal: $${total} CLP`
      : "No hay ventas.",
    data: { count: sales.length, totalGross: total },
  };
}

export async function executeListPurchases(
  storeId: string,
  params: ListPurchasesParams,
): Promise<ActionExecutionResult> {
  const limit = params.limit ?? 20;
  const where = { storeId } as {
    storeId: string;
    occurredAt?: { gte: Date; lte: Date };
  };
  if (params.from && params.to) {
    where.occurredAt = { gte: new Date(params.from), lte: new Date(params.to) };
  }
  const purchases = await prisma.purchase.findMany({
    where,
    select: { id: true, occurredAt: true, totalGross: true },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
  const total = purchases.reduce((acc, p) => acc + (p.totalGross ?? 0), 0);
  const lines = purchases.map(
    (p) =>
      `• ${p.occurredAt.toISOString().slice(0, 10)} $${p.totalGross ?? 0} CLP`,
  );
  return {
    ok: true,
    message: lines.length
      ? `${lines.join("\n")}\nTotal: $${total} CLP`
      : "No hay compras.",
    data: { count: purchases.length, totalGross: total },
  };
}

export async function executeListSuppliers(
  storeId: string,
  params: ListSuppliersParams,
): Promise<ActionExecutionResult> {
  const limit = params.limit ?? 20;
  const suppliers = await prisma.supplier.findMany({
    where: { storeId },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
    take: limit,
  });
  const lines = suppliers.map(
    (s) => `• ${s.name}${s.phone ? ` (${s.phone})` : ""}`,
  );
  return {
    ok: true,
    message: lines.length ? lines.join("\n") : "No hay proveedores.",
    data: { count: suppliers.length },
  };
}

export async function executeListCustomers(
  storeId: string,
  params: ListCustomersParams,
): Promise<ActionExecutionResult> {
  const limit = params.limit ?? 20;
  const customers = await prisma.customer.findMany({
    where: { storeId },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
    take: limit,
  });
  const lines = customers.map(
    (c) => `• ${c.name}${c.phone ? ` (${c.phone})` : ""}`,
  );
  return {
    ok: true,
    message: lines.length ? lines.join("\n") : "No hay clientes.",
    data: { count: customers.length },
  };
}

export async function executeAdjustStock(
  storeId: string,
  params: AdjustStockParams,
): Promise<ActionExecutionResult> {
  const product = await findProductByNameOrBarcode(storeId, params.product);
  if (!product) {
    return {
      ok: false,
      message: `No encontré el producto "${params.product}".`,
    };
  }
  const reason = params.reason as InventoryAdjustmentReason;
  const inventoryService = (await import("../../services/inventory.service.js"))
    .default;
  await inventoryService.adjustStock(storeId, product.id, {
    quantityDelta: params.quantityDelta,
    reason,
    note: params.note ?? "Ajuste vía voz",
  });
  const sign = params.quantityDelta >= 0 ? "+" : "";
  return {
    ok: true,
    message: `Ajuste aplicado a "${product.name}": ${sign}${params.quantityDelta} (${reason}).`,
    data: { productId: product.id },
  };
}

export async function executeCreateSale(
  storeId: string,
  params: CreateSaleParams,
): Promise<ActionExecutionResult> {
  const paymentMethod =
    (params.paymentMethod as PaymentMethod) ?? PaymentMethod.CASH;
  let totalGross = 0;
  const saleItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPriceGross: number;
  }> = [];

  for (const item of params.items) {
    const product = await findProductByNameOrBarcode(storeId, item.product);
    if (!product) {
      return {
        ok: false,
        message: `No encontré el producto "${item.product}".`,
      };
    }
    const lots = await prisma.stockLot.findMany({
      where: { storeId, productId: product.id },
      orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
    });
    const available = lots.reduce(
      (acc, l) => acc + (l.quantityIn - l.quantityOut),
      0,
    );
    if (available < item.quantity) {
      return {
        ok: false,
        message: `Stock insuficiente de "${product.name}" (hay ${available}, pides ${item.quantity}).`,
      };
    }
    const unitPrice = item.unitPriceGross ?? product.salePriceGross ?? 0;
    totalGross += unitPrice * item.quantity;
    saleItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPriceGross: unitPrice,
    });
  }

  const customerId = params.customerId?.trim() || null;
  if (customerId) {
    const cust = await prisma.customer.findFirst({
      where: { storeId, id: customerId },
    });
    if (!cust) {
      return {
        ok: false,
        message: `No encontré el cliente con id "${customerId}".`,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        storeId,
        customerId,
        paymentMethod,
        channel: "IN_STORE",
        totalGross,
      },
    });

    for (const item of saleItems) {
      const saleItem = await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPriceGross: item.unitPriceGross,
        },
      });

      const lots = await tx.stockLot.findMany({
        where: { storeId, productId: item.productId },
        orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
      });
      let remaining = item.quantity;
      for (const lot of lots) {
        if (remaining <= 0) break;
        const avail = lot.quantityIn - lot.quantityOut;
        if (avail <= 0) continue;
        const qty = Math.min(remaining, avail);
        remaining -= qty;
        await tx.stockLot.update({
          where: { id: lot.id },
          data: { quantityOut: { increment: qty } },
        });
        await tx.stockAllocation.create({
          data: {
            storeId,
            productId: item.productId,
            lotId: lot.id,
            quantity: qty,
            referenceType: "SALE",
            referenceId: saleItem.id,
          },
        });
        await tx.saleItemLot.create({
          data: {
            saleItemId: saleItem.id,
            lotId: lot.id,
            quantity: qty,
          },
        });
      }
    }
  });

  return {
    ok: true,
    message: `Venta registrada: $${totalGross.toLocaleString("es-CL")} CLP.`,
    data: { totalGross },
  };
}

export async function executeCreatePurchase(
  storeId: string,
  params: CreatePurchaseParams,
): Promise<ActionExecutionResult> {
  let totalGross = 0;
  const purchaseItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCostGross: number;
  }> = [];

  for (const item of params.items) {
    const product = await findProductByNameOrBarcode(storeId, item.product);
    if (!product) {
      return {
        ok: false,
        message: `No encontré el producto "${item.product}".`,
      };
    }
    const unitCost = item.unitCostGross ?? 0;
    totalGross += unitCost * item.quantity;
    purchaseItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitCostGross: unitCost,
    });
  }

  const supplierId = params.supplierId?.trim() || null;
  if (supplierId) {
    const sup = await prisma.supplier.findFirst({
      where: { storeId, id: supplierId },
    });
    if (!sup) {
      return {
        ok: false,
        message: `No encontré el proveedor con id "${supplierId}".`,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        storeId,
        supplierId,
        notes: params.notes ?? null,
        totalGross,
      },
    });

    for (const item of purchaseItems) {
      await tx.stockLot.create({
        data: {
          storeId,
          productId: item.productId,
          source: StockLotSource.PURCHASE,
          purchaseId: purchase.id,
          quantityIn: item.quantity,
          quantityOut: 0,
          unitCostGross: item.unitCostGross || null,
        },
      });
      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCostGross: item.unitCostGross || null,
        },
      });
    }
  });

  return {
    ok: true,
    message: `Compra registrada: $${totalGross.toLocaleString("es-CL")} CLP.`,
    data: { totalGross },
  };
}

export async function executeCreateSupplier(
  storeId: string,
  params: CreateSupplierParams,
): Promise<ActionExecutionResult> {
  const supplier = await prisma.supplier.create({
    data: {
      storeId,
      name: params.name.trim(),
      rut: params.rut?.trim() || null,
      phone: params.phone?.trim() || null,
      email: params.email?.trim() || null,
    },
  });
  return {
    ok: true,
    message: `Proveedor "${supplier.name}" creado.`,
    data: { supplierId: supplier.id },
  };
}

export async function executeCreateCustomer(
  storeId: string,
  params: CreateCustomerParams,
): Promise<ActionExecutionResult> {
  const customer = await prisma.customer.create({
    data: {
      storeId,
      name: params.name.trim(),
      rut: params.rut?.trim() || null,
      phone: params.phone?.trim() || null,
      email: params.email?.trim() || null,
    },
  });
  return {
    ok: true,
    message: `Cliente "${customer.name}" creado.`,
    data: { customerId: customer.id },
  };
}

export async function executeCreateProductAlert(
  storeId: string,
  params: CreateProductAlertParams,
): Promise<ActionExecutionResult> {
  const product = await findProductByNameOrBarcode(storeId, params.product);
  if (!product) {
    return {
      ok: false,
      message: `No encontré el producto "${params.product}".`,
    };
  }
  await prisma.productAlert.create({
    data: {
      storeId,
      productId: product.id,
      type: params.type.trim(),
      message: params.message.trim(),
    },
  });
  return {
    ok: true,
    message: `Alerta creada para "${product.name}".`,
    data: { productId: product.id },
  };
}
