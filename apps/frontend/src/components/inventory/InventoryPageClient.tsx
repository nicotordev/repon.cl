"use client";

import { useCallback, useMemo, useState } from "react";
import { useInventoryStore } from "@/src/store/inventory.store";
import { ProductCard } from "@/src/components/inventory/ProductCard";
import { ProductFiltersSheet } from "@/src/components/inventory/ProductFiltersSheet";
import { StockAdjustSheet } from "@/src/components/inventory/StockAdjustSheet";
import { ProductFormSheet } from "@/src/components/inventory/ProductFormSheet";
import { BarcodeScannerSheet } from "@/src/components/pos/BarcodeScannerSheet";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Filter, LayoutGrid, List, Loader2, MoreVertical, Plus, ScanBarcode } from "lucide-react";
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
       <div className="flex justify-between items-center gap-2 w-full">
         <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
           {filteredProducts.length}{" "}
           {filteredProducts.length === 1 ? "Producto" : "Productos"}
         </h2>
         <div className="flex items-center gap-2">
           <Button
             variant="default"
             onClick={openNewProduct}
             className="rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
           >
             <Plus className="mr-2 size-4" />
             Nuevo
           </Button>
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button
                 variant="outline"
                 size="icon"
                 className="rounded-xl border-border"
                 aria-label="Más opciones"
               >
                 <MoreVertical className="size-5 text-primary" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-52 rounded-xl p-1">
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
