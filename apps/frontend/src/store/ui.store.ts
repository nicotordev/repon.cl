"use client";

import { create } from "zustand";

export type ActiveTab = "pos" | "inventory" | "reports" | "settings";

type UIState = {
  activeTab: ActiveTab;
  sheetsOpen: (
    | "cart"
    | "payment"
    | "receipt"
    | "filters"
    | "adjust"
    | "copilot"
    | "pending"
    | "actionReview"
  )[];
  toasts: {
    id: string;
    message: string;
    type?: "success" | "error" | "info";
  }[];
  setActiveTab: (tab: ActiveTab) => void;
  openSheet: (name: UIState["sheetsOpen"][number]) => void;
  closeSheet: (name: UIState["sheetsOpen"][number]) => void;
  addToast: (message: string, type?: UIState["toasts"][0]["type"]) => void;
  removeToast: (id: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  activeTab: "pos",
  sheetsOpen: [],
  toasts: [],

  setActiveTab: (activeTab) => set({ activeTab }),

  openSheet: (name) =>
    set((s) => ({
      sheetsOpen: s.sheetsOpen.includes(name)
        ? s.sheetsOpen
        : [...s.sheetsOpen, name],
    })),

  closeSheet: (name) =>
    set((s) => ({ sheetsOpen: s.sheetsOpen.filter((x) => x !== name) })),

  addToast: (message, type = "info") =>
    set((s) => ({
      toasts: [...s.toasts, { id: `toast-${Date.now()}`, message, type }],
    })),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
