"use client";

import {
  Field,
  FieldLabel,
  FieldContent,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSearchCatalog } from "@/hooks/use-inventory";
import type { CatalogProduct } from "@/lib/backend";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 320;

interface ProductFormCatalogSearchProps {
  onSelect: (product: CatalogProduct) => void;
  onClearSelection: () => void;
  selectedProduct: CatalogProduct | null;
  onBack: () => void;
}

export function ProductFormCatalogSearch({
  onSelect,
  onClearSelection,
  selectedProduct,
  onBack,
}: ProductFormCatalogSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(inputValue);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const { data: results = [], isFetching } = useSearchCatalog(debouncedQuery);

  // Mobile-friendly: min touch target 44px (py-3 = 12px*2 + line = ~44px with text)
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        ← Cambiar a crear nuevo
      </button>

      <Field>
        <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Buscar en el catálogo (mín. 2 letras)
        </FieldLabel>
        <FieldContent className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            inputMode="search"
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nombre, marca, categoría..."
            className="h-12 rounded-2xl border-border/50 bg-muted/20 pl-11 pr-10 focus:ring-primary/20"
            autoFocus
          />
          {isFetching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </span>
          )}
        </FieldContent>
      </Field>

      {selectedProduct ? (
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Producto elegido
          </p>
          <p className="mt-1 font-bold text-foreground">{selectedProduct.name}</p>
          {(selectedProduct.brand || selectedProduct.category) && (
            <p className="text-xs text-muted-foreground">
              {[selectedProduct.brand, selectedProduct.category]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <button
            type="button"
            onClick={onClearSelection}
            className="mt-2 text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Elegir otro
          </button>
        </div>
      ) : (
        <div className="max-h-[min(60vh,320px)] overflow-y-auto rounded-2xl border border-border/50 bg-muted/10">
          {inputValue.trim().length < 2 ? (
            <div className="flex min-h-[120px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Escribe al menos 2 letras para buscar
            </div>
          ) : results.length === 0 && !isFetching ? (
            <div className="flex min-h-[120px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
              No hay productos en el catálogo que coincidan o ya están en tu tienda
            </div>
          ) : (
            <ul className="divide-y divide-border/50 p-1">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="flex min-h-[52px] w-full touch-manipulation flex-col items-start justify-center gap-0.5 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                  >
                    <span className="font-semibold text-foreground">
                      {item.name}
                    </span>
                    {(item.brand || item.category) && (
                      <span className="text-xs text-muted-foreground">
                        {[item.brand, item.category].filter(Boolean).join(" · ")}
                        {item.uom && item.uom !== "UNIT" ? ` · ${item.uom}` : ""}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
