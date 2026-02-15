import prisma from "../lib/prisma.js";
import { InventoryAdjustmentReason, StockLotSource } from "../lib/generated/prisma/client.js";

export interface CreateProductInput {
  name: string;
  brand?: string;
  category?: string;
  uom?: "UNIT" | "GRAM" | "KILOGRAM" | "MILLILITER" | "LITER";
  salePriceGross?: number;
  isPerishable?: boolean;
  defaultShelfLifeDays?: number;
  initialStock?: number;
  initialUnitCostGross?: number;
  barcode?: string;
}

export interface UpdateProductInput {
  name?: string;
  brand?: string;
  category?: string;
  uom?: "UNIT" | "GRAM" | "KILOGRAM" | "MILLILITER" | "LITER";
  salePriceGross?: number;
  isPerishable?: boolean;
  defaultShelfLifeDays?: number;
}

export interface AdjustStockInput {
  quantityDelta: number;
  reason: InventoryAdjustmentReason;
  note?: string;
}

const inventoryService = {
  async getProducts(storeId: string) {
    const products = await prisma.product.findMany({
      where: { storeId },
      include: {
        barcodes: { select: { code: true } },
        stockLots: {
          select: {
            quantityIn: true,
            quantityOut: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return products.map((p) => {
      const stock = p.stockLots.reduce(
        (acc, lot) => acc + (lot.quantityIn - lot.quantityOut),
        0,
      );
      return {
        ...p,
        stock,
      };
    });
  },

  async searchProducts(storeId: string, query: string) {
    const q = query.trim();
    const products = await prisma.product.findMany({
      where: {
        storeId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { barcodes: { some: { code: { contains: q } } } },
        ],
      },
      include: {
        barcodes: { select: { code: true } },
        stockLots: {
          select: {
            quantityIn: true,
            quantityOut: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return products.map((p) => {
      const stock = p.stockLots.reduce(
        (acc, lot) => acc + (lot.quantityIn - lot.quantityOut),
        0,
      );
      return {
        ...p,
        stock,
      };
    });
  },

  async getLots(storeId: string) {
    return await prisma.stockLot.findMany({
      where: { storeId },
      include: {
        product: {
          select: { name: true, brand: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  async getAdjustments(storeId: string) {
    return await prisma.inventoryAdjustment.findMany({
      where: { storeId },
      include: {
        product: {
          select: { name: true, brand: true },
        },
      },
      orderBy: { occurredAt: "desc" },
      take: 50,
    });
  },

  async getProduct(storeId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
      include: {
        barcodes: { select: { code: true } },
        stockLots: {
          orderBy: { createdAt: "desc" },
        },
        inventoryAdjustments: {
          orderBy: { occurredAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) return null;

    const stock = product.stockLots.reduce(
      (acc, lot) => acc + (lot.quantityIn - lot.quantityOut),
      0,
    );

    return {
      ...product,
      stock,
    };
  },

  async createProduct(storeId: string, data: CreateProductInput) {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          storeId,
          name: data.name,
          brand: data.brand,
          category: data.category,
          uom: data.uom,
          salePriceGross: data.salePriceGross,
          isPerishable: data.isPerishable ?? false,
          defaultShelfLifeDays: data.defaultShelfLifeDays,
          barcodes: data.barcode
            ? {
                create: { code: data.barcode },
              }
            : undefined,
        },
      });

      if (data.initialStock && data.initialStock > 0) {
        await tx.stockLot.create({
          data: {
            storeId,
            productId: product.id,
            quantityIn: data.initialStock,
            unitCostGross: data.initialUnitCostGross,
            source: StockLotSource.MANUAL,
          },
        });
      }

      return product;
    });
  },

  async updateProduct(storeId: string, productId: string, data: UpdateProductInput) {
    return await prisma.product.update({
      where: { id: productId, storeId },
      data: {
        name: data.name,
        brand: data.brand,
        category: data.category,
        uom: data.uom,
        salePriceGross: data.salePriceGross,
        isPerishable: data.isPerishable,
        defaultShelfLifeDays: data.defaultShelfLifeDays,
      },
    });
  },

  async adjustStock(storeId: string, productId: string, data: AdjustStockInput) {
    const { quantityDelta, reason, note } = data;

    return await prisma.$transaction(async (tx) => {
      // Create adjustment record
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          storeId,
          productId,
          quantityDelta,
          reason,
          note,
        },
      });

      if (quantityDelta > 0) {
        // Increase: Create a new manual lot
        await tx.stockLot.create({
          data: {
            storeId,
            productId,
            quantityIn: quantityDelta,
            source: StockLotSource.ADJUSTMENT,
          },
        });
      } else if (quantityDelta < 0) {
        // Decrease: Consume from existing lots (FIFO)
        let remainingToConsume = Math.abs(quantityDelta);
        const availableLots = await tx.stockLot.findMany({
          where: {
            storeId,
            productId,
            quantityIn: { gt: prisma.stockLot.fields.quantityOut },
          },
          orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
        });

        for (const lot of availableLots) {
          if (remainingToConsume <= 0) break;

          const available = lot.quantityIn - lot.quantityOut;
          const toTake = Math.min(available, remainingToConsume);

          await tx.stockLot.update({
            where: { id: lot.id },
            data: {
              quantityOut: { increment: toTake },
            },
          });

          await tx.stockAllocation.create({
            data: {
              storeId,
              productId,
              lotId: lot.id,
              quantity: toTake,
              referenceType: "INVENTORY_ADJUSTMENT",
              referenceId: adjustment.id,
            },
          });

          remainingToConsume -= toTake;
        }

        if (remainingToConsume > 0) {
          // Optional: handle negative stock or throw error
          // For now we just let it be, but in a real app we might want to prevent this
          // or create a "negative" lot if business rules allow.
        }
      }

      return adjustment;
    });
  },
};

export default inventoryService;
