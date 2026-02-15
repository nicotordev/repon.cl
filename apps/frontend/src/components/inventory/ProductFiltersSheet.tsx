"use client";

import { useInventoryStore } from "@/src/store/inventory.store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useUIStore } from "@/src/store/ui.store";
import { categories } from "@/src/fixtures/products";

export function ProductFiltersSheet() {
  const open = useUIStore((s) => s.sheetsOpen.includes("filters"));
  const closeSheet = useUIStore((s) => s.closeSheet);
  const filters = useInventoryStore((s) => s.filters);
  const setFilters = useInventoryStore((s) => s.setFilters);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeSheet("filters")}>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Búsqueda</Label>
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Nombre o SKU"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <select
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
              value={filters.category ?? ""}
              onChange={(e) =>
                setFilters({ category: e.target.value || null })
              }
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filters.lowStockOnly ? "default" : "outline"}
              className="flex-1"
              onClick={() =>
                setFilters({ lowStockOnly: !filters.lowStockOnly })
              }
            >
              Bajo stock
            </Button>
            <Button
              variant={filters.outOfStockOnly ? "default" : "outline"}
              className="flex-1"
              onClick={() =>
                setFilters({ outOfStockOnly: !filters.outOfStockOnly })
              }
            >
              Sin stock
            </Button>
          </div>
          <Button className="w-full" onClick={() => closeSheet("filters")}>
            Aplicar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
