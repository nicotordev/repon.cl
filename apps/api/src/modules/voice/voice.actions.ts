import { z } from "zod";
import prisma from "../../lib/prisma.js";
import { InventoryAdjustmentReason } from "../../lib/generated/prisma/client.js";

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
