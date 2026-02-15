"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  discountCents?: number;
};

type CartState = {
  items: CartItem[];
  discountCents: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setDiscount: (cents: number) => void;
  clear: () => void;
  totalCents: () => number;
  taxCents: (ratePercent?: number) => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discountCents: 0,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          const qty = item.quantity ?? 1;
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: qty }],
          };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.productId !== productId) };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      setDiscount: (discountCents) => set({ discountCents }),

      clear: () => set({ items: [], discountCents: 0 }),

      totalCents: () => {
        const { items, discountCents } = get();
        const subtotal = items.reduce(
          (sum, i) =>
            sum + i.quantity * i.unitPriceCents - (i.discountCents ?? 0) * i.quantity,
          0
        );
        return Math.max(0, subtotal - discountCents);
      },

      taxCents: (ratePercent = 19) => {
        const total = get().totalCents();
        return Math.round((total * ratePercent) / (100 + ratePercent));
      },
    }),
    { name: "repon-cart" }
  )
);
