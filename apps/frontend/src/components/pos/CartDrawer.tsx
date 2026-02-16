"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PaymentSheet } from "./PaymentSheet";
import { Input } from "../ui/input";

export function CartDrawer() {
  const open = useUIStore((s) => s.sheetsOpen.includes("cart"));
  const openSheet = useUIStore((s) => s.openSheet);
  const closeSheet = useUIStore((s) => s.closeSheet);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalCents = useCartStore((s) => s.totalCents());

  const handleOpenChange = (o: boolean) => {
    if (o) openSheet("cart");
    else closeSheet("cart");
  };

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Carrito</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-auto px-4 pb-8">
            {items.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Agrega productos desde la búsqueda
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((i) => (
                  <li
                    key={i.productId}
                    className="flex items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{i.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {formatMoney(i.unitPriceCents)} × {i.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          updateQuantity(i.productId, i.quantity - 1)
                        }
                      >
                        <Minus className="size-3" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        value={i.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            i.productId,
                            Math.max(1, Number(e.target.value) || 1),
                          )
                        }
                        className="h-8 w-12 text-center text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          updateQuantity(i.productId, i.quantity + 1)
                        }
                      >
                        <Plus className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeItem(i.productId)}
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {items.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-right font-semibold">
                  Total: {formatMoney(totalCents)}
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    closeSheet("cart");
                    openSheet("payment");
                  }}
                >
                  Ir a pagar
                </Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
      <PaymentSheet />
    </>
  );
}
