"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { useState } from "react";

export function PaymentSheet() {
  const open = useUIStore((s) => s.sheetsOpen.includes("payment"));
  const closeSheet = useUIStore((s) => s.closeSheet);
  const openSheet = useUIStore((s) => s.openSheet);
  const totalCents = useCartStore((s) => s.totalCents());
  const clear = useCartStore((s) => s.clear);

  const [received, setReceived] = useState("");
  const total = totalCents / 100;
  const receivedNum = Number.parseFloat(received) || 0;
  const change = Math.max(0, receivedNum - total);

  const handleComplete = () => {
    clear();
    setReceived("");
    closeSheet("payment");
    openSheet("receipt");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeSheet("payment")}>
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>Pago</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <p className="text-lg font-semibold">
            Total: {formatMoney(totalCents)}
          </p>
          <div className="space-y-2">
            <Label>Recibido ($)</Label>
            <Input
              type="number"
              placeholder="0"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
            />
          </div>
          {receivedNum > 0 && (
            <p className="text-muted-foreground">
              Vuelto: {formatMoney(Math.round(change * 100))}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => closeSheet("payment")}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={receivedNum < total}
              onClick={handleComplete}
            >
              Confirmar pago
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
