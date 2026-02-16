"use client";

import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnitOfMeasure } from "@/lib/backend";
import { UOM_OPTIONS } from "@/constants/products";

interface ProductFormStep2PriceProps {
  salePriceGross: string;
  onSalePriceGrossChange: (value: string) => void;
  uom: UnitOfMeasure;
  onUomChange: (value: UnitOfMeasure) => void;
  initialStock: string;
  onInitialStockChange: (value: string) => void;
  barcode: string;
  onBarcodeChange: (value: string) => void;
  isEdit: boolean;
}

export function ProductFormStep2Price({
  salePriceGross,
  onSalePriceGrossChange,
  uom,
  onUomChange,
  initialStock,
  onInitialStockChange,
  barcode,
  onBarcodeChange,
  isEdit,
}: ProductFormStep2PriceProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="rounded-3xl border border-border/50 bg-muted/10 p-5">
        <div className="grid grid-cols-2 gap-6">
          <Field>
            <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Precio Venta (CLP)
            </FieldLabel>
            <FieldContent className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={salePriceGross}
                onChange={(e) => onSalePriceGrossChange(e.target.value)}
                placeholder="0"
                className="h-12 rounded-xl pl-8 font-bold text-primary focus:ring-primary/20"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Unidad
            </FieldLabel>
            <FieldContent>
              <Select value={uom} onValueChange={(v) => onUomChange(v as UnitOfMeasure)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UOM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </div>

        {!isEdit && (
          <div className="mt-4 grid grid-cols-2 gap-6 border-t border-border/50 pt-4">
            <Field>
              <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Stock Inicial
              </FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  value={initialStock}
                  onChange={(e) => onInitialStockChange(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Cód. Barras
              </FieldLabel>
              <FieldContent>
                <Input
                  value={barcode}
                  onChange={(e) => onBarcodeChange(e.target.value)}
                  placeholder="Opcional"
                  className="h-12 rounded-xl"
                />
              </FieldContent>
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
