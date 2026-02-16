"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCreateProduct,
  useAddProductToStore,
  useDeleteProductImage,
  useUpdateProduct,
  useUploadProductImage,
} from "@/hooks/use-inventory";
import type {
  Product,
  UnitOfMeasure,
  CatalogProduct,
} from "@/lib/backend";
import { useInventoryStore } from "@/store/inventory.store";
import { useUIStore } from "@/store/ui.store";
import { DollarSign, Package, Camera } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductFormStepIndicator, type StepConfig } from "./ProductFormStepIndicator";
import {
  ProductFormStep1Choice,
  type CreateMode,
} from "./ProductFormStep1Choice";
import { ProductFormStep1Basic } from "./ProductFormStep1Basic";
import { ProductFormCatalogSearch } from "./ProductFormCatalogSearch";
import { ProductFormStep2Price } from "./ProductFormStep2Price";
import { ProductFormStep3Photo } from "./ProductFormStep3Photo";
import { ProductFormFooter } from "./ProductFormFooter";

const STEPS: readonly StepConfig[] = [
  { id: 1, label: "Datos", icon: Package },
  { id: 2, label: "Precio", icon: DollarSign },
  { id: 3, label: "Foto", icon: Camera },
];

const MAX_IMAGE_MB = 5;

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

  const [createMode, setCreateMode] = useState<CreateMode | null>(null);
  const [selectedCatalogProduct, setSelectedCatalogProduct] =
    useState<CatalogProduct | null>(null);

  const createProduct = useCreateProduct();
  const addProductToStore = useAddProductToStore();
  const updateProduct = useUpdateProduct();
  const uploadImage = useUploadProductImage();
  const deleteImage = useDeleteProductImage();
  const isPending =
    createProduct.isPending ||
    addProductToStore.isPending ||
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
      setCreateMode(null);
      setSelectedCatalogProduct(null);
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
    if (selectedCatalogProduct?.uom && selectedCatalogProduct.uom !== uom) {
      const valid: UnitOfMeasure[] = ["UNIT", "GRAM", "KILOGRAM", "MILLILITER", "LITER"];
      if (valid.includes(selectedCatalogProduct.uom as UnitOfMeasure)) {
        setUom(selectedCatalogProduct.uom as UnitOfMeasure);
      }
    }
  }, [selectedCatalogProduct]);

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
      setCreateMode(null);
      setSelectedCatalogProduct(null);
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

  const productsWithImage = useMemo(
    () =>
      products.filter(
        (p) =>
          p.imageUrl &&
          (isEdit ? p.id !== product?.id : true) &&
          (p.name
            .toLowerCase()
            .includes(imageSearchQuery.trim().toLowerCase()) ||
            p.brand
              ?.toLowerCase()
              .includes(imageSearchQuery.trim().toLowerCase()) ||
            p.category
              ?.toLowerCase()
              .includes(imageSearchQuery.trim().toLowerCase())),
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
        onError: (err) => toast.error(err.message ?? "Error al eliminar foto"),
      });
    }
  };

  const canGoNext = () => {
    if (step === 1) {
      if (createMode === "new") return name.trim().length > 0;
      if (createMode === "existing") return !!selectedCatalogProduct;
      return false;
    }
    if (step === 2) return true;
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (createMode === "new" && !name.trim()) {
        toast.error("El nombre es obligatorio");
        return;
      }
      if (createMode === "existing" && !selectedCatalogProduct) {
        toast.error("Elige un producto del catálogo");
        return;
      }
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
    } else if (selectedCatalogProduct) {
      const stockNum = initialStock.trim() ? parseInt(initialStock, 10) : 0;
      const shelfDays = defaultShelfLifeDays.trim()
        ? parseInt(defaultShelfLifeDays, 10)
        : undefined;
      if (!Number.isNaN(stockNum) && stockNum < 0) {
        toast.error("Stock inicial no puede ser negativo");
        return;
      }
      addProductToStore.mutate(
        {
          productId: selectedCatalogProduct.id,
          salePriceGross: priceNum,
          isPerishable,
          defaultShelfLifeDays: shelfDays,
          initialStock: stockNum || undefined,
        },
        {
          onSuccess: (created) => {
            if (fileToUpload) {
              uploadImage.mutate(
                { productId: created.id, file: fileToUpload },
                {
                  onSuccess: () => {
                    toast.success("Producto agregado a tu tienda");
                    handleOpenChange(false);
                  },
                  onError: (err) => {
                    toast.success("Producto agregado a tu tienda");
                    toast.error(err.message ?? "No se pudo subir la imagen");
                    handleOpenChange(false);
                  },
                },
              );
            } else {
              toast.success("Producto agregado a tu tienda");
              handleOpenChange(false);
            }
          },
          onError: (err) => {
            toast.error(err.message ?? "Error al agregar producto");
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

          <ProductFormStepIndicator
            steps={STEPS}
            currentStep={step}
            onStepClick={setStep}
          />
          <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
            Paso {step} de 3 — {STEPS[step - 1].label}
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && isEdit && (
            <ProductFormStep1Basic
              name={name}
              onNameChange={setName}
              brand={brand}
              onBrandChange={setBrand}
              category={category}
              onCategoryChange={setCategory}
            />
          )}
          {step === 1 && !isEdit && createMode === null && (
            <ProductFormStep1Choice onSelect={setCreateMode} />
          )}
          {step === 1 && !isEdit && createMode === "new" && (
            <ProductFormStep1Basic
              name={name}
              onNameChange={setName}
              brand={brand}
              onBrandChange={setBrand}
              category={category}
              onCategoryChange={setCategory}
            />
          )}
          {step === 1 && !isEdit && createMode === "existing" && (
            <ProductFormCatalogSearch
              onSelect={setSelectedCatalogProduct}
              onClearSelection={() => setSelectedCatalogProduct(null)}
              selectedProduct={selectedCatalogProduct}
              onBack={() => setCreateMode(null)}
            />
          )}

          {step === 2 && (
            <ProductFormStep2Price
              salePriceGross={salePriceGross}
              onSalePriceGrossChange={setSalePriceGross}
              uom={uom}
              onUomChange={setUom}
              initialStock={initialStock}
              onInitialStockChange={setInitialStock}
              barcode={barcode}
              onBarcodeChange={setBarcode}
              isEdit={isEdit || !!selectedCatalogProduct}
            />
          )}

          {step === 3 && (
            <ProductFormStep3Photo
              isPerishable={isPerishable}
              onPerishableChange={setIsPerishable}
              defaultShelfLifeDays={defaultShelfLifeDays}
              onDefaultShelfLifeDaysChange={setDefaultShelfLifeDays}
              currentImageUrl={currentImageUrl}
              canRemoveImage={canRemoveImage}
              imageSearchQuery={imageSearchQuery}
              onImageSearchQueryChange={setImageSearchQuery}
              productsWithImage={productsWithImage}
              allProducts={products}
              onImageChange={handleImageChange}
              onSelectProductImage={handleSelectProductImage}
              onRemoveImage={handleRemoveImage}
              imageFromProductUrl={imageFromProductUrl}
            />
          )}

          <ProductFormFooter
            step={step}
            steps={STEPS}
            isPending={isPending}
            isEdit={isEdit}
            canGoNext={canGoNext}
            onOpenChange={handleOpenChange}
            onStepBack={() => setStep((s) => s - 1)}
            onStepNext={handleNext}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
}
