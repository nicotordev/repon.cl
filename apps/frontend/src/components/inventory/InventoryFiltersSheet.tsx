"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Product } from "@/lib/backend";
import { useInventoryStore } from "@/store/inventory.store";
import { useUIStore } from "@/store/ui.store";
import { X } from "lucide-react";
import { useMemo } from "react";

interface Props {
  products: Product[];
}

export function InventoryFiltersSheet({ products }: Props) {
  const open = useUIStore((s) => s.sheetsOpen.includes("filters"));
  const closeSheet = useUIStore((s) => s.closeSheet);

  const filters = useInventoryStore((s) => s.filters);
  const setFilters = useInventoryStore((s) => s.setFilters);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.category?.trim())
            .filter((c): c is string => Boolean(c && c.length > 0)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      closeSheet("filters");
    }
  };

  const handleClear = () => {
    setFilters({ search: "", category: null, lowStockOnly: false, outOfStockOnly: false });
  };

  const hasActiveFilters =
    Boolean(filters.search?.trim()) ||
    Boolean(filters.category) ||
    filters.lowStockOnly ||
    filters.outOfStockOnly;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base font-semibold">
              Filtros de inventario
            </SheetTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Limpiar
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handleOpenChange(false)}
              aria-label="Cerrar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-4 text-sm">
          <div className="space-y-2">
            <Label>Buscar</Label>
            <Input
              placeholder="Nombre, marca o código de barras"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={filters.category == null ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setFilters({ category: null })}
              >
                Todas
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={filters.category === cat ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setFilters({ category: cat })}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="block">Solo bajo stock</Label>
                <p className="text-xs text-muted-foreground">
                  Muestra productos con stock igual o menor a 5.
                </p>
              </div>
              <Switch
                checked={filters.lowStockOnly}
                onCheckedChange={(checked) =>
                  setFilters({ lowStockOnly: Boolean(checked), outOfStockOnly: false })
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="block">Solo sin stock</Label>
                <p className="text-xs text-muted-foreground">
                  Muestra solo productos con stock 0.
                </p>
              </div>
              <Switch
                checked={filters.outOfStockOnly}
                onCheckedChange={(checked) =>
                  setFilters({ outOfStockOnly: Boolean(checked), lowStockOnly: false })
                }
              />
            </div>
          </div>

          <div className="pt-2">
            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Aplicar filtros
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
