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
import { useAdjustStock } from "@/hooks/use-inventory";
import type { Product } from "@/lib/backend";
import { useInventoryStore } from "@/store/inventory.store";
import { useUIStore } from "@/store/ui.store";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  products: Product[];
}

export function StockAdjustSheet({ products }: Props) {
  const open = useUIStore((s) => s.sheetsOpen.includes("adjust"));
  const closeSheet = useUIStore((s) => s.closeSheet);
  const selectedId = useInventoryStore((s) => s.selectedId);
  const setSelectedId = useInventoryStore((s) => s.setSelectedId);

  const product = products.find((p) => p.id === selectedId);
  const [value, setValue] = useState(0);

  const adjustStock = useAdjustStock();

  useEffect(() => {
    if (open && product) {
      setValue(product.stock ?? 0);
    }
  }, [open, product]);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      closeSheet("adjust");
      setSelectedId(null);
    }
  };

  const handleSave = async () => {
    if (selectedId != null && product) {
      const currentStock = product.stock ?? 0;
      const quantityDelta = value - currentStock;

      if (quantityDelta === 0) {
        handleOpenChange(false);
        return;
      }

      adjustStock.mutate(
        {
          productId: selectedId,
          data: {
            quantityDelta,
            reason: quantityDelta > 0 ? "COUNT_CORRECTION" : "DAMAGE", // Simplified for now
            note: "Ajuste manual desde la web",
          },
        },
        {
          onSuccess: () => {
            toast.success("Stock actualizado correctamente");
            handleOpenChange(false);
          },
          onError: (err) => {
            toast.error(`Error al actualizar stock: ${err.message}`);
          },
        },
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Ajustar stock — {product?.name ?? ""}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Cantidad actual: {product?.stock ?? 0}</Label>
            <Input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(Number(e.target.value) || 0)}
              disabled={adjustStock.isPending}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={adjustStock.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={adjustStock.isPending}
            >
              {adjustStock.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
