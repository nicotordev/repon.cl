"use client";

import {
  Field,
  FieldLabel,
  FieldContent,
} from "@/components/ui/field";
import { Package, Search } from "lucide-react";

export type CreateMode = "new" | "existing";

interface ProductFormStep1ChoiceProps {
  onSelect: (mode: CreateMode) => void;
}

export function ProductFormStep1Choice({ onSelect }: ProductFormStep1ChoiceProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <Field>
        <FieldLabel className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          ¿Cómo quieres agregar el producto?
        </FieldLabel>
        <FieldContent className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect("new")}
            className="flex min-h-[88px] touch-manipulation flex-col items-center justify-center gap-2 rounded-2xl border-2 border-border/60 bg-muted/20 p-5 text-left transition-all active:scale-[0.98] hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Package className="size-6" />
            </span>
            <span className="font-bold leading-tight text-foreground">
              Crear producto nuevo
            </span>
            <span className="text-xs text-muted-foreground">
              Nombre, marca, categoría
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelect("existing")}
            className="flex min-h-[88px] touch-manipulation flex-col items-center justify-center gap-2 rounded-2xl border-2 border-border/60 bg-muted/20 p-5 text-left transition-all active:scale-[0.98] hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Search className="size-6" />
            </span>
            <span className="font-bold leading-tight text-foreground">
              Buscar en el catálogo
            </span>
            <span className="text-xs text-muted-foreground">
              Agregar producto ya existente
            </span>
          </button>
        </FieldContent>
      </Field>
    </div>
  );
}
