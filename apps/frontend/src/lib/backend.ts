import 'server-only';
import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.API_URL;

export type UnitOfMeasure = "UNIT" | "GRAM" | "KILOGRAM" | "MILLILITER" | "LITER";

export type InventoryAdjustmentReason =
  | "COUNT_CORRECTION"
  | "DAMAGE"
  | "EXPIRED"
  | "THEFT"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "OTHER";

export interface StockLot {
  id: string;
  storeId: string;
  productId: string;
  source: string;
  quantityIn: number;
  quantityOut: number;
  unitCostNet?: number;
  unitCostGross?: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  product?: { name: string; brand?: string };
}

export interface InventoryAdjustment {
  id: string;
  storeId: string;
  productId: string;
  reason: InventoryAdjustmentReason;
  note?: string;
  quantityDelta: number;
  occurredAt: string;
  createdAt: string;
  product?: { name: string; brand?: string };
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  brand?: string;
  category?: string;
  uom: UnitOfMeasure;
  salePriceGross?: number;
  vatRateBps: number;
  isVatExempt: boolean;
  isPerishable: boolean;
  defaultShelfLifeDays?: number;
  createdAt: string;
  updatedAt: string;
  stock?: number;
  barcodes?: { code: string }[];
  stockLots?: StockLot[];
  inventoryAdjustments?: InventoryAdjustment[];
}

export interface CreateProductInput {
  name: string;
  brand?: string;
  category?: string;
  uom?: UnitOfMeasure;
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
  uom?: UnitOfMeasure;
  salePriceGross?: number;
  isPerishable?: boolean;
  defaultShelfLifeDays?: number;
}

export interface AdjustStockInput {
  quantityDelta: number;
  reason: InventoryAdjustmentReason;
  note?: string;
}

async function fetcher<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  // Ensure header is not null
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || response.statusText);
  }

  return response.json();
}

const backend = {
  // User
  getUser: async () => {
    return fetcher<any>('/api/v1/user'); // Keeping any here for now as User type isn't defined in this context yet
  },

  // Inventory
  inventory: {
    getProducts: async (q?: string) => {
      const url = q ? `/api/v1/inventory?q=${encodeURIComponent(q)}` : '/api/v1/inventory';
      return fetcher<Product[]>(url);
    },

    getProduct: async (id: string) => {
      return fetcher<Product | null>(`/api/v1/inventory/${id}`);
    },

    createProduct: async (data: CreateProductInput) => {
      return fetcher<Product>('/api/v1/inventory', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateProduct: async (id: string, data: UpdateProductInput) => {
      return fetcher<Product>(`/api/v1/inventory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    adjustStock: async (id: string, data: AdjustStockInput) => {
      return fetcher<InventoryAdjustment>(`/api/v1/inventory/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getLots: async () => {
      return fetcher<StockLot[]>('/api/v1/inventory/lots');
    },

    getAdjustments: async () => {
      return fetcher<InventoryAdjustment[]>('/api/v1/inventory/adjustments');
    },
  },
};

export default backend;
