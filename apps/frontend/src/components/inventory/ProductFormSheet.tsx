"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  Loader2,
  ImagePlus,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Package,
  DollarSign,
  Camera,
} from "lucide-react";
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

const STEPS = [
  { id: 1, label: "Datos", icon: Package },
  { id: 2, label: "Precio", icon: DollarSign },
  { id: 3, label: "Foto", icon: Camera },
] as const;

async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("No se pudo cargar la imagen");
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] ?? "jpg";
  return new File([blob], `${filename}.${ext}`, { type: blob.type });
}

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

  const [step, setStep] = useState(1);
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
  const [imageFromProductUrl, setImageFromProductUrl] = useState<string | null>(
    null,
  );
  const [imageSearchQuery, setImageSearchQuery] = useState("");

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
      setStep(1);
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
      setImageFromProductUrl(null);
      setImageSearchQuery("");
    } else if (open && !product) {
      setStep(1);
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
      setImageFromProductUrl(null);
      setImageSearchQuery("");
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
      setImageFromProductUrl(null);
      setStep(1);
      closeSheet("productForm");
      setEditProductId(null);
      setPendingNewProductBarcode(null);
    }
  };

  const currentImageUrl =
    imagePreviewUrl ?? imageFromProductUrl ?? product?.imageUrl ?? null;
  const canRemoveImage = Boolean(
    product?.imageUrl || imageFile || imageFromProductUrl,
  );
  const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/gif";
  const MAX_IMAGE_MB = 5;

  const productsWithImage = useMemo(
    () =>
      products.filter(
        (p) =>
          p.imageUrl &&
          (isEdit ? p.id !== product?.id : true) &&
          (p.name.toLowerCase().includes(imageSearchQuery.trim().toLowerCase()) ||
            p.brand?.toLowerCase().includes(imageSearchQuery.trim().toLowerCase()) ||
            p.category?.toLowerCase().includes(imageSearchQuery.trim().toLowerCase()))
      ),
    [products, isEdit, product?.id, imageSearchQuery],
  );

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
    setImageFromProductUrl(null);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSelectProductImage = (p: Product) => {
    if (!p.imageUrl) return;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImageFromProductUrl(p.imageUrl);
    setImagePreviewUrl(null);
    toast.success(`Usando imagen de "${p.name}"`);
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageFromProductUrl(null);
    if (product?.imageUrl) {
      deleteImage.mutate(product.id, {
        onSuccess: () => toast.success("Foto eliminada"),
        onError: (err) =>
          toast.error(err.message ?? "Error al eliminar foto"),
      });
    }
  };

  const canGoNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return true;
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (step < 3) setStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    let fileToUpload: File | null = imageFile;
    if (!fileToUpload && imageFromProductUrl) {
      try {
        fileToUpload = await urlToFile(imageFromProductUrl, nameTrim);
      } catch {
        toast.error(
          "No se pudo usar la imagen del otro producto. Sube una foto manualmente.",
        );
        return;
      }
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
            if (fileToUpload) {
              uploadImage.mutate(
                { productId: product.id, file: fileToUpload },
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
            if (fileToUpload) {
              uploadImage.mutate(
                { productId: created.id, file: fileToUpload },
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
          <SheetTitle className="text-center text-xl font-black tracking-tight">
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </SheetTitle>

          {/* Step indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isPast = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={`
                      flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 transition-all
                      ${isActive ? "border-primary bg-primary text-primary-foreground shadow-lg" : ""}
                      ${isPast ? "border-primary/50 bg-primary/10 text-primary" : ""}
                      ${!isActive && !isPast ? "border-muted bg-muted/30 text-muted-foreground" : ""}
                    `}
                  >
                    <Icon className="size-5" />
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-4 rounded-full ${isPast ? "bg-primary/50" : "bg-muted"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
            Paso {step} de 3 — {STEPS[step - 1].label}
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Info básica */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
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
                      autoFocus
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
          )}

          {/* Step 2: Precio y stock */}
          {step === 2 && (
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
            </div>
          )}

          {/* Step 3: Foto y perecederos */}
          {step === 3 && (
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
                        JPG, PNG, WebP. Máx. 5MB.
                      </p>
                    </div>
                  </div>

                  {/* Buscar en mis productos */}
                  <div className="rounded-2xl border border-border/50 bg-muted/10 p-4">
                    <p className="mb-3 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Search className="size-3.5" />
                      Usar imagen de otro producto
                    </p>
                    <Input
                      placeholder="Buscar por nombre, marca o categoría..."
                      value={imageSearchQuery}
                      onChange={(e) => setImageSearchQuery(e.target.value)}
                      className="mb-3 h-10 rounded-xl border-border/50 text-sm"
                    />
                    <div className="flex max-h-32 gap-2 overflow-y-auto rounded-xl p-1">
                      {productsWithImage.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground">
                          {products.filter((p) => p.imageUrl).length === 0
                            ? "Ningún producto tiene imagen aún."
                            : "No hay coincidencias. Escribe para buscar."}
                        </p>
                      ) : (
                        productsWithImage.slice(0, 12).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProductImage(p)}
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
          )}

          <SheetFooter className="sticky bottom-0 mt-8 flex flex-row gap-3 border-t border-border/50 bg-background pt-4">
            {step === 1 ? (
              <>
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
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="h-12 flex-2 rounded-2xl bg-primary font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/80 active:scale-95 disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="ml-2 size-5" />
                </Button>
              </>
            ) : step === 2 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 flex-1 rounded-2xl font-bold"
                  onClick={() => setStep(1)}
                  disabled={isPending}
                >
                  <ChevronLeft className="mr-2 size-5" />
                  Atrás
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-12 flex-2 rounded-2xl bg-primary font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/80 active:scale-95 disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="ml-2 size-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 flex-1 rounded-2xl font-bold"
                  onClick={() => setStep(2)}
                  disabled={isPending}
                >
                  <ChevronLeft className="mr-2 size-5" />
                  Atrás
                </Button>
                <Button
                  type="submit"
                  className="h-12 flex-2 rounded-2xl bg-primary font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/80 active:scale-95 disabled:opacity-50"
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
              </>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
