"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { loadQueue, type PendingAction } from "@/src/lib/offlineQueue";

type OfflineState = {
  isOnline: boolean;
  queue: PendingAction[];
  lastSyncAt: string | null;
  setOnline: (v: boolean) => void;
  refreshQueue: () => void;
  setLastSyncAt: (at: string | null) => void;
};

export const useOfflineStore = create<OfflineState>()(
  subscribeWithSelector((set) => ({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    queue: typeof window !== "undefined" ? loadQueue() : [],
    lastSyncAt: null,

    setOnline: (isOnline) => set({ isOnline }),

    refreshQueue: () => set({ queue: loadQueue() }),

    setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  })),
);

if (typeof window !== "undefined") {
  window.addEventListener("online", () =>
    useOfflineStore.getState().setOnline(true),
  );
  window.addEventListener("offline", () =>
    useOfflineStore.getState().setOnline(false),
  );
}
