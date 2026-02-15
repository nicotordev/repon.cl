"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/src/lib/backend";

export type { Product };

export type InventoryFilters = {
  search: string;
  category: string | null;
  lowStockOnly: boolean;
  outOfStockOnly: boolean;
};

type InventoryState = {
  products: Product[];
  filters: InventoryFilters;
  selectedId: string | null;
  setProducts: (p: Product[]) => void;
  setFilters: (f: Partial<InventoryFilters>) => void;
  setSelectedId: (id: string | null) => void;
  updateProductStock: (id: string, stock: number) => void;
  filteredProducts: () => Product[];
};

const defaultFilters: InventoryFilters = {
  search: "",
  category: null,
  lowStockOnly: false,
  outOfStockOnly: false,
};

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      products: [],
      filters: defaultFilters,
      selectedId: null,

      setProducts: (products) => set({ products }),

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),

      setSelectedId: (selectedId) => set({ selectedId }),

      updateProductStock: (id, stock) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, stock } : p)),
        })),

      filteredProducts: () => {
        const { products, filters } = get();
        return products.filter((p) => {
          if (filters.search) {
            const q = filters.search.toLowerCase();
            const hasBarcode = p.barcodes?.some(b => b.code.toLowerCase().includes(q));
            if (
              !p.name.toLowerCase().includes(q) &&
              !p.brand?.toLowerCase().includes(q) &&
              !hasBarcode
            )
              return false;
          }
          if (filters.category && p.category !== filters.category) return false;
          if (filters.lowStockOnly) {
            const threshold = 5; // TODO: maybe add a lowStockThreshold to Product
            if ((p.stock ?? 0) > threshold) return false;
          }
          if (filters.outOfStockOnly && (p.stock ?? 0) > 0) return false;
          return true;
        });
      },
    }),
    { name: "repon-inventory" },
  ),
);
