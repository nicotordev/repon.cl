"use client";

import type { Product } from "@/src/lib/backend";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { formatMoney } from "@/src/lib/money";
import { useInventoryStore } from "@/src/store/inventory.store";
import { useUIStore } from "@/src/store/ui.store";
import { Pencil } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const setSelectedId = useInventoryStore((s) => s.setSelectedId);
  const setEditProductId = useInventoryStore((s) => s.setEditProductId);
  const openSheet = useUIStore((s) => s.openSheet);
  const threshold = 5;
  const stock = product.stock ?? 0;
  const isLow = stock <= threshold && stock > 0;
  const isOut = stock === 0;

  const handleAdjust = () => {
    setSelectedId(product.id);
    openSheet("adjust");
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProductId(product.id);
    openSheet("productForm");
  };

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md relative overflow-hidden"
      onClick={handleAdjust}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 size-8 rounded-lg opacity-70 hover:opacity-100 hover:bg-muted"
        onClick={handleEdit}
        aria-label="Editar producto"
      >
        <Pencil className="size-4" />
      </Button>
      {product.imageUrl ? (
        <div className="h-28 w-full bg-muted">
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <CardHeader className="pb-1 pr-10">
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
