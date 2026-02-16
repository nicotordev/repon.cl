"use client";

import {
  Field,
  FieldLabel,
  FieldContent,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImagePlus, Search, X } from "lucide-react";
import type { Product } from "@/lib/backend";

const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/gif";

interface ProductFormStep3PhotoProps {
  isPerishable: boolean;
  onPerishableChange: (value: boolean) => void;
  defaultShelfLifeDays: string;
  onDefaultShelfLifeDaysChange: (value: string) => void;
  currentImageUrl: string | null;
  canRemoveImage: boolean;
  imageSearchQuery: string;
  onImageSearchQueryChange: (value: string) => void;
  productsWithImage: Product[];
  allProducts: Product[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectProductImage: (product: Product) => void;
  onRemoveImage: () => void;
  imageFromProductUrl: string | null;
}

export function ProductFormStep3Photo({
  isPerishable,
  onPerishableChange,
  defaultShelfLifeDays,
  onDefaultShelfLifeDaysChange,
  currentImageUrl,
  canRemoveImage,
  imageSearchQuery,
  onImageSearchQueryChange,
  productsWithImage,
  allProducts,
  onImageChange,
  onSelectProductImage,
  onRemoveImage,
  imageFromProductUrl,
}: ProductFormStep3PhotoProps) {
  const hasAnyProductWithImage = allProducts.some((p) => p.imageUrl);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      <Field className="flex flex-row items-center justify-between rounded-2xl border border-secondary/25 bg-secondary/10 p-4 ring-1 ring-secondary/20">
        <div className="space-y-0.5">
          <FieldLabel className="text-sm font-bold">
            ¿Es perecedero?
          </FieldLabel>
          <p className="text-[11px] text-muted-foreground">
            Activa para gestionar fechas de vencimiento.
          </p>
        </div>
        <Switch
          checked={isPerishable}
          onCheckedChange={onPerishableChange}
          className="data-[state=checked]:bg-secondary data-[state=unchecked]:bg-muted"
        />
      </Field>

      {isPerishable && (
        <Field className="animate-in slide-in-from-top-2">
          <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Vida útil estándar (Días)
          </FieldLabel>
          <FieldContent>
            <Input
              type="number"
              value={defaultShelfLifeDays}
              onChange={(e) => onDefaultShelfLifeDaysChange(e.target.value)}
              placeholder="Ej. 7"
              className="h-12 rounded-xl"
            />
          </FieldContent>
        </Field>
      )}

      <Field>
        <FieldLabel className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Imagen del Producto
        </FieldLabel>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-5">
            <div className="group relative size-24 shrink-0 overflow-hidden rounded-[2rem] border-2 border-dashed border-border/50 bg-muted/30 transition-colors hover:border-secondary/50">
              {currentImageUrl ? (
                <>
                  <img
                    src={currentImageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                  {canRemoveImage && (
                    <button
                      type="button"
                      onClick={onRemoveImage}
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-lg backdrop-blur-sm"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground/40">
                  <ImagePlus className="size-6" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="product-image"
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-secondary px-4 text-xs font-bold transition-all hover:bg-secondary/80 active:scale-95"
              >
                {currentImageUrl ? "Cambiar foto" : "Subir foto"}
              </Label>
              <input
                id="product-image"
                type="file"
                accept={ACCEPT_IMAGE}
                className="hidden"
                onChange={onImageChange}
              />
              <p className="text-[10px] leading-tight text-muted-foreground">
                JPG, PNG, WebP. Máx. 5MB.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-muted/10 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Search className="size-3.5" />
              Usar imagen de otro producto
            </p>
            <Input
              placeholder="Buscar por nombre, marca o categoría..."
              value={imageSearchQuery}
              onChange={(e) => onImageSearchQueryChange(e.target.value)}
              className="mb-3 h-10 rounded-xl border-border/50 text-sm"
            />
            <div className="flex max-h-32 gap-2 overflow-y-auto rounded-xl p-1">
              {productsWithImage.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  {!hasAnyProductWithImage
                    ? "Ningún producto tiene imagen aún."
                    : "No hay coincidencias. Escribe para buscar."}
                </p>
              ) : (
                productsWithImage.slice(0, 12).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectProductImage(p)}
                    className={`
                      relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all
                      ${imageFromProductUrl === p.imageUrl ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/30"}
                    `}
                  >
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </Field>
    </div>
  );
}
