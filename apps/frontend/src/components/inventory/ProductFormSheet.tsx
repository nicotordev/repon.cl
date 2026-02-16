"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/src/components/ui/field";
import { useUIStore } from "@/src/store/ui.store";
import { useInventoryStore } from "@/src/store/inventory.store";
import {
  useCreateProduct,
  useUpdateProduct,
  useUploadProductImage,
  useDeleteProductImage,
} from "@/src/hooks/use-inventory";
import { Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/src/lib/backend";
import type { UnitOfMeasure } from "@/src/lib/backend";
import { categories } from "@/src/fixtures/products";

const UOM_OPTIONS: { value: UnitOfMeasure; label: string }[] = [
  { value: "UNIT", label: "Unidad" },
  { value: "GRAM", label: "Gramos" },
  { value: "KILOGRAM", label: "Kilogramos" },
  { value: "MILLILITER", label: "Mililitros" },
  { value: "LITER", label: "Litros" },
];

interface Props {
  products: Product[];
}

export function ProductFormSheet({ products }: Props) {
  const open = useUIStore((s) => s.sheetsOpen.includes("productForm"));
  const closeSheet = useUIStore((s) => s.closeSheet);
  const editProductId = useInventoryStore((s) => s.editProductId);
  const setEditProductId = useInventoryStore((s) => s.setEditProductId);
  const pendingNewProductBarcode = useInventoryStore(
    (s) => s.pendingNewProductBarcode,
  );
  const setPendingNewProductBarcode = useInventoryStore(
    (s) => s.setPendingNewProductBarcode,
  );

  const product = editProductId
    ? products.find((p) => p.id === editProductId)
    : null;
  const isEdit = Boolean(product);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [uom, setUom] = useState<UnitOfMeasure>("UNIT");
  const [salePriceGross, setSalePriceGross] = useState<string>("");
  const [initialStock, setInitialStock] = useState<string>("0");
  const [barcode, setBarcode] = useState("");
  const [isPerishable, setIsPerishable] = useState(false);
  const [defaultShelfLifeDays, setDefaultShelfLifeDays] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadImage = useUploadProductImage();
  const deleteImage = useDeleteProductImage();
  const isPending =
    createProduct.isPending ||
    updateProduct.isPending ||
    uploadImage.isPending ||
    deleteImage.isPending;

  useEffect(() => {
    if (open && product) {
      setName(product.name);
      setBrand(product.brand ?? "");
      setCategory(product.category ?? "");
      setUom(product.uom ?? "UNIT");
      setSalePriceGross(String(product.salePriceGross ?? ""));
      setInitialStock("");
      setBarcode(product.barcodes?.[0]?.code ?? "");
      setIsPerishable(product.isPerishable ?? false);
      setDefaultShelfLifeDays(String(product.defaultShelfLifeDays ?? ""));
      setImageFile(null);
      setImagePreviewUrl(null);
    } else if (open && !product) {
      setName("");
      setBrand("");
      setCategory("");
      setUom("UNIT");
      setSalePriceGross("");
      setInitialStock("0");
      setBarcode(pendingNewProductBarcode ?? "");
      setIsPerishable(false);
      setDefaultShelfLifeDays("");
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  }, [open, product, pendingNewProductBarcode]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImageFile(null);
      setImagePreviewUrl(null);
      closeSheet("productForm");
      setEditProductId(null);
      setPendingNewProductBarcode(null);
    }
  };

  const currentImageUrl = imagePreviewUrl ?? product?.imageUrl ?? null;
  const canRemoveImage = Boolean(product?.imageUrl || imageFile);
  const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/gif";
  const MAX_IMAGE_MB = 5;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Máximo ${MAX_IMAGE_MB} MB`);
      return;
    }
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      toast.error("Formato no válido. Usa JPEG, PNG, WebP o GIF.");
      return;
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    if (product?.imageUrl) {
      deleteImage.mutate(product.id, {
        onSuccess: () => {
          toast.success("Foto eliminada");
          // Refresh product in parent will show updated product without image
        },
        onError: (err) => toast.error(err.message ?? "Error al eliminar foto"),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = name.trim();
    if (!nameTrim) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const priceNum = salePriceGross.trim()
      ? parseInt(salePriceGross, 10)
      : undefined;
    if (
      salePriceGross.trim() &&
      (priceNum === undefined || Number.isNaN(priceNum) || priceNum < 0)
    ) {
      toast.error("Precio debe ser un número válido");
      return;
    }

    if (isEdit && product) {
      const shelfDays = defaultShelfLifeDays.trim()
        ? parseInt(defaultShelfLifeDays, 10)
        : undefined;
      updateProduct.mutate(
        {
          productId: product.id,
          data: {
            name: nameTrim,
            brand: brand.trim() || undefined,
            category: category.trim() || undefined,
            uom,
            salePriceGross: priceNum,
            isPerishable,
            defaultShelfLifeDays: shelfDays,
          },
        },
        {
          onSuccess: () => {
            if (imageFile) {
              uploadImage.mutate(
                { productId: product.id, file: imageFile },
                {
                  onSuccess: () => {
                    toast.success("Producto actualizado");
                    handleOpenChange(false);
                  },
                  onError: (err) => {
                    toast.error(err.message ?? "Error al subir la imagen");
                  },
                },
              );
            } else {
              toast.success("Producto actualizado");
              handleOpenChange(false);
            }
          },
          onError: (err) => {
            toast.error(err.message ?? "Error al actualizar");
          },
        },
      );
    } else {
      const stockNum = initialStock.trim() ? parseInt(initialStock, 10) : 0;
      const shelfDays = defaultShelfLifeDays.trim()
        ? parseInt(defaultShelfLifeDays, 10)
        : undefined;
      if (!Number.isNaN(stockNum) && stockNum < 0) {
        toast.error("Stock inicial no puede ser negativo");
        return;
      }
      createProduct.mutate(
        {
          name: nameTrim,
          brand: brand.trim() || undefined,
          category: category.trim() || undefined,
          uom,
          salePriceGross: priceNum,
          initialStock: stockNum || undefined,
          barcode: barcode.trim() || undefined,
          isPerishable,
          defaultShelfLifeDays: shelfDays,
        },
        {
          onSuccess: (created) => {
            if (imageFile) {
              uploadImage.mutate(
                { productId: created.id, file: imageFile },
                {
                  onSuccess: () => {
                    toast.success("Producto creado");
                    handleOpenChange(false);
                  },
                  onError: (err) => {
                    toast.success("Producto creado");
                    toast.error(err.message ?? "No se pudo subir la imagen");
                    handleOpenChange(false);
                  },
                },
              );
            } else {
              toast.success("Producto creado");
              handleOpenChange(false);
            }
          },
          onError: (err) => {
            toast.error(err.message ?? "Error al crear");
          },
        },
      );
    }
  };

  const categoryOptions =
    categories.length > 0
      ? categories
      : ["Bebidas", "Abarrotes", "Lácteos", "Verduras", "Panadería", "Otro"];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-[2.5rem] px-6 pb-8"
      >
        <SheetHeader className="pb-4">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
          <SheetTitle className="text-xl font-black tracking-tight">
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección: Información Principal */}
          <div className="space-y-4">
            <FieldGroup className="grid gap-4">
              <Field>
                <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nombre del Producto *
                </FieldLabel>
                <FieldContent>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Coca-Cola 1.5L"
                    className="h-12 rounded-2xl border-border/50 bg-muted/20 focus:ring-primary/20"
                  />
                </FieldContent>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Marca
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Ej. Coca-Cola"
                      className="h-12 rounded-2xl"
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
                      onValueChange={(v) => setCategory(v === "_none" ? "" : v)}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-muted/20">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Sin categoría</SelectItem>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </div>
            </FieldGroup>
          </div>

          {/* Sección: Precio y Stock */}
          <div className="rounded-3xl border border-border/50 bg-muted/10 p-5">
            <div className="grid grid-cols-2 gap-6">
              <Field>
                <FieldLabel className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-primary">
                  Precio Venta (CLP)
                </FieldLabel>
                <FieldContent className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    value={salePriceGross}
                    onChange={(e) => setSalePriceGross(e.target.value)}
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
                  <Select
                    value={uom}
                    onValueChange={(v) => setUom(v as UnitOfMeasure)}
                  >
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
                      onChange={(e) => setInitialStock(e.target.value)}
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
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Opcional"
                      className="h-12 rounded-xl"
                    />
                  </FieldContent>
                </Field>
              </div>
            )}
          </div>

          {/* Sección: Foto y Perecederos */}
          <div className="space-y-5">
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
                onCheckedChange={setIsPerishable}
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
                    onChange={(e) => setDefaultShelfLifeDays(e.target.value)}
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
                          onClick={handleRemoveImage}
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
                    onChange={handleImageChange}
                  />
                  <p className="text-[10px] leading-tight text-muted-foreground">
                    Formatos: JPG, PNG, WebP. <br /> Máximo 5MB por archivo.
                  </p>
                </div>
              </div>
            </Field>
          </div>

          <SheetFooter className="sticky bottom-0 mt-8 flex flex-row gap-3 border-t border-border/50 bg-background pt-4">
            <Button
              type="button"
              variant="ghost"
              className="h-12 flex-1 rounded-2xl font-bold"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-12 flex-[2] rounded-2xl bg-primary font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/80 active:scale-95 disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : isEdit ? (
                "Guardar Cambios"
              ) : (
                "Crear Producto"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
