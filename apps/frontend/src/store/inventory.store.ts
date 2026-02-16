"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InventoryFilters = {
  search: string;
  category: string | null;
  lowStockOnly: boolean;
  outOfStockOnly: boolean;
};

type InventoryState = {
  filters: InventoryFilters;
  selectedId: string | null;
  editProductId: string | null;
  /** When set, ProductFormSheet in create mode pre-fills barcode and then clears this. */
  pendingNewProductBarcode: string | null;
  setFilters: (f: Partial<InventoryFilters>) => void;
  setSelectedId: (id: string | null) => void;
  setEditProductId: (id: string | null) => void;
  setPendingNewProductBarcode: (barcode: string | null) => void;
};

const defaultFilters: InventoryFilters = {
  search: "",
  category: null,
  lowStockOnly: false,
  outOfStockOnly: false,
};

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      selectedId: null,
      editProductId: null,
      pendingNewProductBarcode: null,

      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),

      setSelectedId: (selectedId) => set({ selectedId }),
      setEditProductId: (editProductId) => set({ editProductId }),
      setPendingNewProductBarcode: (pendingNewProductBarcode) =>
        set({ pendingNewProductBarcode }),
    }),
    { name: "repon-inventory" },
  ),
);
