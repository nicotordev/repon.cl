"use client";

import type { Store } from "@/lib/store-types";
import { useStoreStore } from "@/store/store.store";
import { useStores } from "@/hooks/use-stores";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type StoreContextValue = {
  /** List of stores the user is a member of. */
  stores: Store[];
  /** Currently selected store (from selection or first store). */
  store: Store | null;
  /** Id of the selected store, or null if none. */
  storeId: string | null;
  /** Set the selected store by id. Pass null to clear (will fallback to first store when available). */
  setStoreId: (id: string | null) => void;
  /** Loading state of the stores list. */
  isLoading: boolean;
  /** Error loading stores. */
  error: Error | null;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { data: stores = [], isLoading, error } = useStores();
  const selectedStoreId = useStoreStore((s) => s.selectedStoreId);
  const setSelectedStoreId = useStoreStore((s) => s.setSelectedStoreId);

  const store = useMemo(() => {
    if (!stores.length) return null;
    const byId = stores.find((s) => s.id === selectedStoreId);
    return byId ?? stores[0];
  }, [stores, selectedStoreId]);

  const storeId = store?.id ?? null;

  const setStoreId = useCallback(
    (id: string | null) => {
      setSelectedStoreId(id);
    },
    [setSelectedStoreId],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      stores,
      store,
      storeId,
      setStoreId,
      isLoading,
      error: error ?? null,
    }),
    [stores, store, storeId, setStoreId, isLoading, error],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}

/** Safe hook: returns null if outside StoreProvider. */
export function useStoreOptional(): StoreContextValue | null {
  return useContext(StoreContext);
}
