"use client";

import { ProductQuickSearch } from "@/src/components/pos/ProductQuickSearch";
import { CartDrawer } from "@/src/components/pos/CartDrawer";
import { ReceiptSheet } from "@/src/components/pos/ReceiptSheet";
import { useCartStore } from "@/src/store/cart.store";
import { Button } from "@/src/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useUIStore } from "@/src/store/ui.store";
import { formatMoney } from "@/src/lib/money";

export function POSPageClient() {
  const items = useCartStore((s) => s.items);
  const openSheet = useUIStore((s) => s.openSheet);
  const totalCents = useCartStore((s) => s.totalCents());

  return (
    <div className="flex flex-col gap-4 p-4">
      <ProductQuickSearch />
      <div className="sticky bottom-24 flex justify-end">
        <Button
          size="lg"
          className="gap-2"
          onClick={() => openSheet("cart")}
        >
          <ShoppingCart className="size-5" />
          Carrito ({items.length}) — {formatMoney(totalCents)}
        </Button>
      </div>
      <CartDrawer />
      <ReceiptSheet />
    </div>
  );
}
