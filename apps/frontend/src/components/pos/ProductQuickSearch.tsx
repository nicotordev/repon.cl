"use client";

import { BarcodeScannerSheet } from "@/components/pos/BarcodeScannerSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventory } from "@/hooks/use-inventory";
import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/store/cart.store";
import { ScanBarcode, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

export function ProductQuickSearch() {
  const [q, setQ] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { data } = useInventory();
  const products = data ?? [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products.slice(0, 8);

    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term) ||
        p.barcodes?.some((b) => b.code.toLowerCase().includes(term)),
    );
  }, [products, q]);

  const handleBarcodeDetect = useCallback(
    (code: string) => {
      const normalized = code.trim();
      const product = products.find((p) =>
        p.barcodes?.some(
          (b) =>
            b.code === normalized ||
            b.code.replace(/\s/g, "") === normalized.replace(/\s/g, ""),
        ),
      );
      if (product) {
        addItem({
          productId: product.id,
          name: product.name,
          unitPriceCents: product.salePriceGross ?? 0,
          quantity: 1,
        });
        toast.success(`${product.name} agregado al carrito`);
      } else {
        setQ(normalized);
        toast.info(
          "Código no encontrado. Busca o agrega el producto manualmente.",
        );
      }
    },
    [products, addItem],
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto o código..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => setScannerOpen(true)}
          aria-label="Escanear código de barras"
        >
          <ScanBarcode className="size-5" />
        </Button>
      </div>
      <BarcodeScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetect={handleBarcodeDetect}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filtered.map((p) => (
          <Button
            key={p.id}
            variant="outline"
            className="h-auto flex-col items-stretch gap-0.5 p-3 text-left"
            onClick={() =>
              addItem({
                productId: p.id,
                name: p.name,
                unitPriceCents: p.salePriceGross ?? 0,
                quantity: 1,
              })
            }
          >
            <span className="truncate font-medium">{p.name}</span>
            <span className="text-muted-foreground text-xs">
              {formatMoney(p.salePriceGross ?? 0)} — Stock: {p.stock}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
