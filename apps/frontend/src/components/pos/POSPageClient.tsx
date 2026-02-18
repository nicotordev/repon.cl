"use client";

import { CartDrawer } from "@/components/pos/CartDrawer";
import { ProductQuickSearch } from "@/components/pos/ProductQuickSearch";
import { ReceiptSheet } from "@/components/pos/ReceiptSheet";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { Minus, Plus, Trash2 } from "lucide-react";

export function POSPageClient() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalCents = useCartStore((s) => s.totalCents());
  const openSheet = useUIStore((s) => s.openSheet);

  return (
    <div className="flex flex-col gap-6 p-4">
      <ProductQuickSearch />

      <Card className="gap-0 py-0">
        <CardHeader className="py-4">
          <CardTitle className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">
            Carrito
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed border-border bg-muted/5 py-10 text-center text-sm">
              Agrega productos desde la búsqueda
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((i) => (
                <Card
                  key={i.productId}
                  className="flex flex-row items-center justify-between gap-3 border-border/80 bg-card/50 px-4 py-3 shadow-none"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {i.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formatMoney(i.unitPriceCents)} × {i.quantity}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
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
                      size="icon"
                      className="size-8"
                      onClick={() =>
                        updateQuantity(i.productId, i.quantity + 1)
                      }
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => removeItem(i.productId)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </CardContent>
        {items.length > 0 && (
          <CardFooter className="flex flex-col gap-3 border-t border-border py-4">
            <p className="w-full text-right text-lg font-semibold text-foreground">
              Total: {formatMoney(totalCents)}
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={() => openSheet("payment")}
            >
              Ir a pagar
            </Button>
          </CardFooter>
        )}
      </Card>

      <CartDrawer />
      <ReceiptSheet />
    </div>
  );
}
