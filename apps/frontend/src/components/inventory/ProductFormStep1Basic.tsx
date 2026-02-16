"use client";

import {
  Field,
  FieldContent,
  FieldGroup,
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
import { CATEGORIES } from "@/constants/products";

interface ProductFormStep1BasicProps {
  name: string;
  onNameChange: (value: string) => void;
  brand: string;
  onBrandChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

export function ProductFormStep1Basic({
  name,
  onNameChange,
  brand,
  onBrandChange,
  category,
  onCategoryChange,
}: ProductFormStep1BasicProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <FieldGroup className="grid gap-4">
        <Field>
          <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Nombre del Producto *
          </FieldLabel>
          <FieldContent>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ej. Coca-Cola 1.5L"
              className="h-12 w-full rounded-2xl border-border/50 bg-muted/20 focus:ring-primary/20"
              autoFocus
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Marca
          </FieldLabel>
          <FieldContent>
            <Input
              value={brand}
              onChange={(e) => onBrandChange(e.target.value)}
              placeholder="Ej. Coca-Cola"
              className="h-12 w-full rounded-2xl"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Categoría
          </FieldLabel>
          <FieldContent>
            <Select
              value={category || "_none"}
              onValueChange={(v) => onCategoryChange(v === "_none" ? "" : v)}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl border-border/50 bg-muted/20">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin categoría</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      </FieldGroup>
    </div>
  );
}
