"use client";

import { useCallback, useMemo, useState } from "react";
import { useInventoryStore } from "@/src/store/inventory.store";
import { ProductCard } from "@/src/components/inventory/ProductCard";
import { ProductFiltersSheet } from "@/src/components/inventory/ProductFiltersSheet";
import { StockAdjustSheet } from "@/src/components/inventory/StockAdjustSheet";
import { ProductFormSheet } from "@/src/components/inventory/ProductFormSheet";
import { BarcodeScannerSheet } from "@/src/components/pos/BarcodeScannerSheet";
import { Button } from "@/src/components/ui/button";
import { Filter, Loader2, Plus, ScanBarcode } from "lucide-react";
import { useUIStore } from "@/src/store/ui.store";
import { EmptyState } from "@/src/components/common/EmptyState";
import type { Product } from "@/src/lib/backend";
import { useInventory } from "@/src/hooks/use-inventory";

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

  const { data: queryProducts, isLoading } = useInventory(undefined, initialProducts);
  const products = queryProducts ?? [];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hasBarcode = p.barcodes?.some((b) => b.code.toLowerCase().includes(q));
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
    <div className="flex flex-col gap-6 p-4 pb-20 sm:p-6">
      {/* Header de Acciones */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 py-2 backdrop-blur supports-backdrop-filter:bg-background/60">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "Producto" : "Productos"}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-border"
            onClick={() => setScannerOpen(true)}
            aria-label="Escanear código para nuevo producto"
          >
            <ScanBarcode className="size-5 text-primary" />
          </Button>
          <Button
            variant="default"
            onClick={openNewProduct}
            className="rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="mr-2 size-4" />
            Nuevo
          </Button>
          <Button
            variant="outline"
            onClick={() => openSheet("filters")}
            className="relative rounded-xl border border-border bg-card shadow-sm transition-all hover:bg-accent active:scale-95"
          >
            <Filter className="mr-2 size-4 text-primary" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                {activeFiltersCount}
              </span>
            )}
          </Button>
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
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* Overlays / Sheets */}
      <ProductFiltersSheet />
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
