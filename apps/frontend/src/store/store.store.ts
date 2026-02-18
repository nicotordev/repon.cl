"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "repon-store-selected-id";

type StoreState = {
  selectedStoreId: string | null;
  setSelectedStoreId: (id: string | null) => void;
};

export const useStoreStore = create<StoreState>()(
  persist(
    (set) => ({
      selectedStoreId: null,
      setSelectedStoreId: (selectedStoreId) => set({ selectedStoreId }),
    }),
    { name: STORAGE_KEY },
  ),
);
