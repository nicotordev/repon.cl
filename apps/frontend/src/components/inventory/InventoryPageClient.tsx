"use client";

import { useEffect, useRef } from "react";
import { useInventoryStore } from "@/src/store/inventory.store";
import { ProductCard } from "@/src/components/inventory/ProductCard";
import { ProductFiltersSheet } from "@/src/components/inventory/ProductFiltersSheet";
import { StockAdjustSheet } from "@/src/components/inventory/StockAdjustSheet";
import { Button } from "@/src/components/ui/button";
import { Filter, Loader2 } from "lucide-react";
import { useUIStore } from "@/src/store/ui.store";
import { EmptyState } from "@/src/components/common/EmptyState";
import type { Product } from "@/src/lib/backend";
import { useInventory } from "@/src/hooks/use-inventory";

interface Props {
  initialProducts: Product[];
}

export function InventoryPageClient({ initialProducts }: Props) {
  const setProducts = useInventoryStore((s) => s.setProducts);
  const filteredProducts = useInventoryStore((s) => s.filteredProducts());
  const openSheet = useUIStore((s) => s.openSheet);
  
  const { data: products, isLoading } = useInventory(undefined, initialProducts);

  useEffect(() => {
    if (products) {
      setProducts(products);
    }
  }, [products, setProducts]);

  if (isLoading && !products) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => openSheet("filters")}>
          <Filter className="size-4" />
          Filtros
        </Button>
      </div>
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description="Ajusta los filtros o agrega productos."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
      <ProductFiltersSheet />
      <StockAdjustSheet />
    </div>
  );
}
