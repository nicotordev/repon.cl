"use client";

import type { Product } from "@/src/store/inventory.store";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { formatMoney } from "@/src/lib/money";
import { useInventoryStore } from "@/src/store/inventory.store";
import { useUIStore } from "@/src/store/ui.store";

export function ProductCard({ product }: { product: Product }) {
  const setSelectedId = useInventoryStore((s) => s.setSelectedId);
  const openSheet = useUIStore((s) => s.openSheet);
  const threshold = 5;
  const stock = product.stock ?? 0;
  const isLow = stock <= threshold && stock > 0;
  const isOut = stock === 0;

  const handleAdjust = () => {
    setSelectedId(product.id);
    openSheet("adjust");
  };

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleAdjust}
    >
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-tight">{product.name}</p>
          {product.brand && (
            <span className="text-muted-foreground shrink-0 text-xs">
              {product.brand}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-lg font-semibold">{formatMoney(product.salePriceGross ?? 0)}</p>
        <div className="flex flex-wrap gap-1">
          <Badge variant={isOut ? "destructive" : isLow ? "secondary" : "outline"}>
            Stock: {stock} {product.uom ?? "UNIT"}
          </Badge>
          {product.category && (
            <Badge variant="outline">{product.category}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
