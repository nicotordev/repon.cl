import "server-only";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL;

type ErrorPayload = {
  message?: string;
  error?: string;
};

export class BackendError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendError";
    this.status = status;
  }
}


export interface User {
  id: string;
  email: string;
  name: string | null;
  clerkId: string | null;
  phone: string | null;
  birthDate: string | null;
  locale: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  bannedAt: Date | null;
  bannedReason: string | null;
  bannedBy: string | null;
  onboardingCompleted: string | null;
}

export interface OnboardingProfileInput {
  name?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  locale?: string | null;
  avatarUrl?: string | null;
  completeOnboarding?: boolean;
  preferences?: {
    notificationsEnabled?: boolean;
    theme?: string | null;
    language?: string | null;
  };
  store?: {
    name: string;
    rut?: string | null;
    address?: string | null;
    timezone?: string | null;
    currency?: string | null;
  };
}

export type UnitOfMeasure =
  | "UNIT"
  | "GRAM"
  | "KILOGRAM"
  | "MILLILITER"
  | "LITER";

export type StockLotSource =
  | "PURCHASE"
  | "MANUAL"
  | "ADJUSTMENT"
  | "RETURN";

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
  source: StockLotSource;
  purchaseId?: string | null;
  quantityIn: number;
  quantityOut: number;
  unitCostNet?: number | null;
  unitCostGross?: number | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { name: string; brand?: string | null };
}

export interface InventoryAdjustment {
  id: string;
  storeId: string;
  productId: string;
  reason: InventoryAdjustmentReason;
  note?: string | null;
  lotId?: string | null;
  quantityDelta: number;
  occurredAt: string;
  createdAt: string;
  product?: { name: string; brand?: string | null };
}

/** Product: global catalog + store-specific fields (API merges Product + StoreProduct). */
export interface Product {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  uom: UnitOfMeasure;
  salePriceGross?: number | null;
  vatRateBps?: number;
  isVatExempt?: boolean;
  isPerishable?: boolean;
  defaultShelfLifeDays?: number | null;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  imageUrl?: string | null;
}

export interface AdjustStockInput {
  quantityDelta: number;
  reason: InventoryAdjustmentReason;
  note?: string;
}

/** Catalog search result (global product not yet in store). */
export interface CatalogProduct {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  uom: string;
}

export interface AddProductToStoreInput {
  productId: string;
  salePriceGross?: number;
  isPerishable?: boolean;
  defaultShelfLifeDays?: number;
  initialStock?: number;
  initialUnitCostGross?: number;
}

async function fetcher<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({} as ErrorPayload));

    const message =
      (typeof error.message === "string" && error.message) ||
      (typeof error.error === "string" && error.error) ||
      response.statusText ||
      "An error occurred";

    throw new BackendError(response.status, message);
  }

  return response.json();
}

const backend = {
  // User
  getUser: async () => {
    return fetcher<User>("/api/v1/user");
  },

  updateUserProfile: async (data: OnboardingProfileInput) => {
    return fetcher<User>("/api/v1/user", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Inventory
  inventory: {
    getProducts: async (q?: string) => {
      const url = q
        ? `/api/v1/inventory?q=${encodeURIComponent(q)}`
        : "/api/v1/inventory";
      return fetcher<Product[]>(url);
    },

    getProduct: async (id: string) => {
      return fetcher<Product | null>(`/api/v1/inventory/${id}`);
    },

    createProduct: async (data: CreateProductInput) => {
      return fetcher<Product>("/api/v1/inventory", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    updateProduct: async (id: string, data: UpdateProductInput) => {
      return fetcher<Product>(`/api/v1/inventory/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    adjustStock: async (id: string, data: AdjustStockInput) => {
      return fetcher<InventoryAdjustment>(`/api/v1/inventory/${id}/adjust`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    getLots: async () => {
      return fetcher<StockLot[]>("/api/v1/inventory/lots");
    },

    getAdjustments: async () => {
      return fetcher<InventoryAdjustment[]>("/api/v1/inventory/adjustments");
    },
  },
};

export default backend;
