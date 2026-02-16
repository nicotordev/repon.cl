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

    const priceNum = salePriceGross.trim() ? parseInt(salePriceGross, 10) : undefined;
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
                }
              );
            } else {
              toast.success("Producto actualizado");
              handleOpenChange(false);
            }
          },
          onError: (err) => {
            toast.error(err.message ?? "Error al actualizar");
          },
        }
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
                }
              );
            } else {
              toast.success("Producto creado");
              handleOpenChange(false);
            }
          },
          onError: (err) => {
            toast.error(err.message ?? "Error al crear");
          },
        }
      );
    }
  };

  const categoryOptions = categories.length > 0 ? categories : ["Bebidas", "Abarrotes", "Lácteos", "Verduras", "Panadería", "Otro"];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Editar producto" : "Nuevo producto"}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel>Nombre *</FieldLabel>
              <FieldContent>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Coca-Cola 1.5L"
                  className="rounded-xl"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Marca</FieldLabel>
              <FieldContent>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ej. Coca-Cola"
                  className="rounded-xl"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Categoría</FieldLabel>
              <FieldContent>
                <Select
                  value={category || "_none"}
                  onValueChange={(v) => setCategory(v === "_none" ? "" : v)}
                >
                  <SelectTrigger className="rounded-xl">
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

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Unidad de medida</FieldLabel>
                <FieldContent>
                  <Select value={uom} onValueChange={(v) => setUom(v as UnitOfMeasure)}>
                    <SelectTrigger className="rounded-xl">
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
              <Field>
                <FieldLabel>Precio de venta (CLP)</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={salePriceGross}
                    onChange={(e) => setSalePriceGross(e.target.value)}
                    placeholder="0"
                    className="rounded-xl"
                  />
                </FieldContent>
              </Field>
            </div>

            {!isEdit && (
              <>
                <Field>
                  <FieldLabel>Stock inicial</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      min={0}
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                      className="rounded-xl"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Código de barras</FieldLabel>
                  <FieldContent>
                    <Input
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Opcional"
                      className="rounded-xl"
                    />
                  </FieldContent>
                </Field>
              </>
            )}

            <Field className="flex flex-row items-center justify-between rounded-2xl border border-border/50 bg-muted/10 p-4">
              <div>
                <FieldLabel>Perecedero</FieldLabel>
                <p className="text-xs text-muted-foreground">
                  Productos con fecha de vencimiento
                </p>
              </div>
              <Switch
                checked={isPerishable}
                onCheckedChange={setIsPerishable}
                className="data-[state=checked]:bg-primary"
              />
            </Field>

            {isPerishable && (
              <Field>
                <FieldLabel>Días de vida útil (opcional)</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min={1}
                    value={defaultShelfLifeDays}
                    onChange={(e) => setDefaultShelfLifeDays(e.target.value)}
                    placeholder="Ej. 7"
                    className="rounded-xl"
                  />
                </FieldContent>
              </Field>
            )}

            <Field>
              <FieldLabel>Foto del producto</FieldLabel>
              <FieldContent className="space-y-2">
                {currentImageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={currentImageUrl}
                      alt="Vista previa"
                      className="h-24 w-24 rounded-xl border object-cover"
                    />
                    {canRemoveImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={deleteImage.isPending}
                        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                        aria-label="Eliminar foto"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="product-image"
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border/50 bg-muted/5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/10"
                  >
                    <ImagePlus className="size-4" />
                    {currentImageUrl ? "Cambiar imagen" : "Elegir imagen"}
                  </Label>
                  <input
                    id="product-image"
                    type="file"
                    accept={ACCEPT_IMAGE}
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP o GIF. Máx. {MAX_IMAGE_MB} MB.
                </p>
              </FieldContent>
            </Field>
          </FieldGroup>

          <SheetFooter className="flex-row gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
