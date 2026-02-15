"use client";

import { useState, useEffect } from "react";
import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";
import { useCartStore } from "@/src/store/cart.store";
import { useInventoryStore } from "@/src/store/inventory.store";
import { Button } from "@/src/components/ui/button";
import { mockProducts } from "@/src/fixtures/products";
import { formatMoney } from "@/src/lib/money";

export function ProductQuickSearch() {
  const [q, setQ] = useState("");
  const addItem = useCartStore((s) => s.addItem);
  const setProducts = useInventoryStore((s) => s.setProducts);
  const products = useInventoryStore((s) => s.products);

  useEffect(() => {
    if (products.length === 0) setProducts(mockProducts);
  }, [products.length, setProducts]);
  const filtered = q.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.brand?.toLowerCase().includes(q.toLowerCase()) ||
          p.barcodes?.some(b => b.code.toLowerCase().includes(q.toLowerCase()))
      )
    : products.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto o código..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
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
