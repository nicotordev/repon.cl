import prisma from "../lib/prisma.js";
import {
  InventoryAdjustmentReason,
  StockLotSource,
  UnitOfMeasure,
} from "../lib/generated/prisma/client.js";

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
  imageUrl?: string | null;
}

export interface AdjustStockInput {
  quantityDelta: number;
  reason: InventoryAdjustmentReason;
  note?: string;
}

function mapStoreProductToRow(
  sp: {
    product: {
      id: string;
      name: string;
      brand: string | null;
      category: string | null;
      uom: string;
      barcodes: { code: string }[];
      stockLots: { quantityIn: number; quantityOut: number }[];
    };
    salePriceGross: number | null;
    imageUrl: string | null;
  },
) {
  const stock = sp.product.stockLots.reduce(
    (acc, lot) => acc + (lot.quantityIn - lot.quantityOut),
    0,
  );
  return {
    id: sp.product.id,
    name: sp.product.name,
    brand: sp.product.brand,
    category: sp.product.category,
    uom: sp.product.uom,
    salePriceGross: sp.salePriceGross,
    imageUrl: sp.imageUrl,
    barcodes: sp.product.barcodes,
    stockLots: sp.product.stockLots,
    stock,
  };
}

const inventoryService = {
  async getProducts(storeId: string) {
    const rows = await prisma.storeProduct.findMany({
      where: { storeId },
      include: {
        product: {
          include: {
            barcodes: { select: { code: true } },
            stockLots: {
              where: { storeId },
              select: { quantityIn: true, quantityOut: true },
            },
          },
        },
      },
      orderBy: { product: { name: "asc" } },
    });
    return rows.map((sp) => mapStoreProductToRow(sp));
  },

  async searchProducts(storeId: string, query: string) {
    const q = query.trim();
    const rows = await prisma.storeProduct.findMany({
      where: {
        storeId,
        product: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { barcodes: { some: { code: { contains: q } } } },
          ],
        },
      },
      include: {
        product: {
          include: {
            barcodes: { select: { code: true } },
            stockLots: {
              where: { storeId },
              select: { quantityIn: true, quantityOut: true },
            },
          },
        },
      },
      orderBy: { product: { name: "asc" } },
    });
    return rows.map((sp) => mapStoreProductToRow(sp));
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
    const sp = await prisma.storeProduct.findFirst({
      where: { storeId, productId },
      include: {
        product: {
          include: {
            barcodes: { select: { code: true } },
            stockLots: {
              where: { storeId },
              orderBy: { createdAt: "desc" },
            },
            inventoryAdjustments: {
              where: { storeId },
              orderBy: { occurredAt: "desc" },
              take: 10,
            },
          },
        },
      },
    });
    if (!sp) return null;

    const stock = sp.product.stockLots.reduce(
      (acc, lot) => acc + (lot.quantityIn - lot.quantityOut),
      0,
    );
    return {
      ...sp.product,
      salePriceGross: sp.salePriceGross,
      isPerishable: sp.isPerishable,
      defaultShelfLifeDays: sp.defaultShelfLifeDays,
      imageUrl: sp.imageUrl,
      stock,
      inventoryAdjustments: sp.product.inventoryAdjustments,
    };
  },

  async createProduct(storeId: string, data: CreateProductInput) {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          brand: data.brand,
          category: data.category,
          uom: data.uom,
          barcodes: data.barcode
            ? { create: { code: data.barcode } }
            : undefined,
        },
      });

      await tx.storeProduct.create({
        data: {
          storeId,
          productId: product.id,
          salePriceGross: data.salePriceGross,
          isPerishable: data.isPerishable ?? false,
          defaultShelfLifeDays: data.defaultShelfLifeDays,
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
    await prisma.$transaction(async (tx) => {
      const productData: {
        name?: string;
        brand?: string;
        category?: string;
        uom?: UnitOfMeasure;
      } = {};
      if (data.name !== undefined) productData.name = data.name;
      if (data.brand !== undefined) productData.brand = data.brand;
      if (data.category !== undefined) productData.category = data.category;
      if (data.uom !== undefined) productData.uom = data.uom as UnitOfMeasure;
      if (Object.keys(productData).length > 0) {
        await tx.product.update({ where: { id: productId }, data: productData });
      }

      const storeProductData: {
        salePriceGross?: number;
        isPerishable?: boolean;
        defaultShelfLifeDays?: number | null;
        imageUrl?: string | null;
      } = {};
      if (data.salePriceGross !== undefined) storeProductData.salePriceGross = data.salePriceGross;
      if (data.isPerishable !== undefined) storeProductData.isPerishable = data.isPerishable;
      if (data.defaultShelfLifeDays !== undefined)
        storeProductData.defaultShelfLifeDays = data.defaultShelfLifeDays;
      if (data.imageUrl !== undefined) storeProductData.imageUrl = data.imageUrl;
      if (Object.keys(storeProductData).length > 0) {
        await tx.storeProduct.updateMany({
          where: { storeId, productId },
          data: storeProductData,
        });
      }
    });
    const updated = await this.getProduct(storeId, productId);
    if (!updated) throw new Error("Product not found after update");
    return updated;
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

  async deleteProduct(storeId: string, productId: string) {
    const sp = await prisma.storeProduct.findFirst({
      where: { storeId, productId },
      select: { productId: true },
    });
    if (!sp) return null;

    await prisma.$transaction(async (tx) => {
      const lotIds = await tx.stockLot
        .findMany({ where: { productId, storeId }, select: { id: true } })
        .then((rows) => rows.map((r) => r.id));

      await tx.stockAllocation.deleteMany({ where: { productId, storeId } });
      if (lotIds.length > 0) {
        await tx.saleItemLot.deleteMany({ where: { lotId: { in: lotIds } } });
      }
      await tx.inventoryAdjustment.deleteMany({ where: { productId, storeId } });
      await tx.stockLot.deleteMany({ where: { productId, storeId } });
      await tx.productAlert.deleteMany({ where: { storeId, productId } });
      await tx.storeProduct.deleteMany({ where: { storeId, productId } });
    });
    return productId;
  },

  async deleteManyProducts(storeId: string, productIds: string[]) {
    if (productIds.length === 0) return { count: 0 };
    const uniqueIds = [...new Set(productIds)];
    let count = 0;
    await prisma.$transaction(async (tx) => {
      for (const productId of uniqueIds) {
        const lotIds = await tx.stockLot
          .findMany({ where: { productId, storeId }, select: { id: true } })
          .then((rows) => rows.map((r) => r.id));
        await tx.stockAllocation.deleteMany({ where: { productId, storeId } });
        if (lotIds.length > 0) {
          await tx.saleItemLot.deleteMany({ where: { lotId: { in: lotIds } } });
        }
        await tx.inventoryAdjustment.deleteMany({ where: { productId, storeId } });
        await tx.stockLot.deleteMany({ where: { productId, storeId } });
        await tx.productAlert.deleteMany({ where: { storeId, productId } });
        const sp = await tx.storeProduct.deleteMany({ where: { storeId, productId } });
        count += sp.count;
      }
    });
    return { count };
  },
};

export default inventoryService;
