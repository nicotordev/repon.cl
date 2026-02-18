"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { ProductCard } from "@/components/inventory/ProductCard";
import { ProductFormSheet } from "@/components/inventory/ProductFormSheet";
import { StockAdjustSheet } from "@/components/inventory/StockAdjustSheet";
import { InventoryFiltersSheet } from "@/components/inventory/InventoryFiltersSheet";
import { BarcodeScannerSheet } from "@/components/pos/BarcodeScannerSheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInventory } from "@/hooks/use-inventory";
import type { Product } from "@/lib/backend";
import { useInventoryStore } from "@/store/inventory.store";
import { useUIStore } from "@/store/ui.store";
import {
  Filter,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Plus,
  ScanBarcode,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface Props {
  initialProducts: Product[];
}

export function InventoryPageClient({ initialProducts }: Props) {
  const filters = useInventoryStore((s) => s.filters);
  const openSheet = useUIStore((s) => s.openSheet);
  const setEditProductId = useInventoryStore((s) => s.setEditProductId);
  const setPendingNewProductBarcode = useInventoryStore(
    (s) => s.setPendingNewProductBarcode,
  );
  const [scannerOpen, setScannerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const openNewProduct = () => {
    setEditProductId(null);
    openSheet("productForm");
  };

  const handleBarcodeDetect = useCallback(
    (code: string) => {
      const normalized = code.trim();
      setPendingNewProductBarcode(normalized);
      setEditProductId(null);
      openSheet("productForm");
      setScannerOpen(false);
    },
    [setPendingNewProductBarcode, setEditProductId, openSheet],
  );

  const { data: queryProducts, isLoading } = useInventory(
    undefined,
    initialProducts,
  );
  const products = queryProducts ?? [];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hasBarcode = p.barcodes?.some((b) =>
          b.code.toLowerCase().includes(q),
        );
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.brand?.toLowerCase().includes(q) &&
          !hasBarcode
        )
          return false;
      }
      if (filters.category && p.category !== filters.category) return false;
      if (filters.lowStockOnly) {
        const threshold = 5;
        if ((p.stock ?? 0) > threshold) return false;
      }
      if (filters.outOfStockOnly && (p.stock ?? 0) > 0) return false;
      return true;
    });
  }, [products, filters]);

  if (isLoading && !queryProducts) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-12 animate-ping rounded-full bg-primary/20" />
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
        <p className="text-xs font-medium text-muted-foreground animate-pulse">
          Cargando inventario...
        </p>
      </div>
    );
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex min-h-0 flex-col gap-6 p-4 pb-24 sm:p-6">
      {/* Header de Acciones */}
      <div className="sticky top-0 z-10 -mx-4 flex shrink-0 items-center justify-between gap-2 bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60 sm:mx-0 sm:px-0">
        <h2 className="min-w-0 truncate text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "Producto" : "Productos"}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="default"
            onClick={openNewProduct}
            className="h-10 min-h-10 min-w-[44px] touch-manipulation rounded-xl bg-primary px-4 text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
            aria-label="Nuevo producto"
          >
            <Plus className="mr-2 size-4" />
            Nuevo
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 min-h-[44px] min-w-[44px] touch-manipulation rounded-xl border-border"
                aria-label="Más opciones"
              >
                <MoreVertical className="size-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="end"
              sideOffset={6}
              className="w-52 rounded-xl p-1 shadow-lg"
            >
                <DropdownMenuRadioGroup
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as "grid" | "list")}
                >
                  <DropdownMenuRadioItem value="grid" className="rounded-lg">
                    <LayoutGrid className="size-4" />
                    Vista en cuadrícula
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="list" className="rounded-lg">
                    <List className="size-4" />
                    Vista en lista
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => setScannerOpen(true)}
                >
                  <ScanBarcode className="size-4" />
                  Escanear código
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => openSheet("filters")}
                >
                  <Filter className="size-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {activeFiltersCount}
                    </span>
                  )}
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Lista de Productos */}
      {filteredProducts.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10">
          <EmptyState
            title="No encontramos nada"
            description={
              filters.search
                ? `No hay resultados para "${filters.search}". Intenta con otros términos.`
                : "Parece que no hay productos con estos filtros."
            }
            actions={
              <Button
                variant="ghost"
                onClick={() => openSheet("filters")}
                className="text-primary hover:bg-accent hover:text-accent-foreground"
              >
                Limpiar filtros
              </Button>
            }
          />
        </div>
      ) : viewMode === "list" ? (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} variant="list" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} variant="grid" />
          ))}
        </div>
      )}

      {/* Overlays / Sheets */}
      <InventoryFiltersSheet products={products} />
      <StockAdjustSheet products={products} />
      <ProductFormSheet products={products} />
      <BarcodeScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetect={handleBarcodeDetect}
      />
    </div>
  );
}
