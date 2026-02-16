"use client";

import * as React from "react";
import type { Product } from "@/src/lib/backend";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { formatMoney } from "@/src/lib/money";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { useDeleteProduct } from "@/src/hooks/use-inventory";
import { useInventoryStore } from "@/src/store/inventory.store";
import { useUIStore } from "@/src/store/ui.store";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PiPackage } from "react-icons/pi";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/src/lib/utils"; // shadcn

// Skeleton Loader for mutation states
function ProductCardSkeleton() {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-3xl border-border/60 bg-card py-0 opacity-70 pointer-events-none"
      )}
    >
      <div className="relative h-36 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/70 to-muted/30 animate-pulse" />
      </div>
      <CardContent className="p-3">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-3 w-20 rounded bg-muted animate-pulse mt-1" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="h-6 w-16 rounded bg-muted animate-pulse" />
          <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/50 animate-pulse" />
            <span className="h-3 w-8 bg-muted-foreground/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="h-4 w-10 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="mt-4 flex items-center justify-center">
          <div className="h-3 w-32 rounded bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const setSelectedId = useInventoryStore((s) => s.setSelectedId);
  const setEditProductId = useInventoryStore((s) => s.setEditProductId);
  const openSheet = useUIStore((s) => s.openSheet);
  const deleteProduct = useDeleteProduct();

  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false);

  const threshold = 5;
  const stock = product.stock ?? 0;
  const isLow = stock <= threshold && stock > 0;
  const isOut = stock === 0;

  const handleAdjust = () => {
    setSelectedId(product.id);
    openSheet("adjust");
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProductId(product.id);
    openSheet("productForm");
  };

  const handleConfirmDelete = () => {
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        toast.success("Producto eliminado");
        setShowDeleteAlert(false);
      },
      onError: (err) => {
        toast.error(err.message ?? "Error al eliminar producto");
      },
    });
  };

  const stockDotClass = isOut
    ? "bg-destructive"
    : isLow
      ? "bg-amber-500"
      : "bg-emerald-500";

  // Show skeleton while deleting (mutation)
  if (deleteProduct.isPending) {
    return <ProductCardSkeleton />;
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={handleAdjust}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleAdjust();
        }}
        className={cn(
          "group relative overflow-hidden rounded-3xl border-border/60 bg-card",
          "transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/5",
          "active:translate-y-0 active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "py-0",
        )}
      >
        {/* Media */}
        <div className="relative h-36 w-full overflow-hidden">
          {/* Fondo bonito incluso sin imagen */}
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/80 to-foreground/70" />

          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              priority={false}
            />
          ) : (
            <div className="relative z-[1] flex h-full items-center justify-center">
              <div className="flex items-center gap-2 rounded-2xl bg-background/10 px-4 py-2 backdrop-blur-md">
                {/* Use PiPackage from react-icons */}
                <PiPackage className="size-5 text-background/90" />
                <span className="text-xs font-semibold text-background/90">
                  Sin imagen
                </span>
              </div>
            </div>
          )}

          {/* Overlay por Sin Stock */}
          {isOut && (
            <div className="absolute right-2 bottom-2 z-[2] grid place-items-center">
              <Badge
                variant="destructive"
                className="rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-tight"
              >
                Sin stock
              </Badge>
            </div>
          )}

          {/* Acciones (aparecen al hover/focus) */}
          <div className="absolute right-3 top-3 z-[3] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Abrir acciones"
                  className={cn(
                    "size-9 rounded-2xl bg-background/85 shadow-sm backdrop-blur-md",
                    "hover:bg-background",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* lucide-react MoreHorizontal */}
                  <MoreHorizontal className="size-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-44 rounded-2xl p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={handleEdit}
                  className="rounded-xl p-3"
                >
                  {/* lucide-react Pencil */}
                  <Pencil className="mr-2 size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteAlert(true)}
                  className="rounded-xl p-3 text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  {/* lucide-react Trash2 */}
                  <Trash2 className="mr-2 size-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-3">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-1 text-base font-extrabold leading-tight text-foreground capitalize">
                {product.name}
              </h3>
            </div>

            {product.brand ? (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                {product.brand}
              </p>
            ) : (
              <p className="text-[11px] font-medium text-muted-foreground/70">
                &nbsp;
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatMoney(product.salePriceGross ?? 0)}
            </p>

            <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-1.5">
              <span className={cn("size-2 rounded-full", stockDotClass)} />
              <span className="text-xs font-bold text-foreground/80">
                {stock}
                <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                  {product.uom ?? "UNIT"}
                </span>
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {product.category && (
              <Badge
                variant="secondary"
                className="rounded-xl border-none bg-muted/50 px-2.5 py-1 text-[10px] font-bold text-muted-foreground"
              >
                {product.category}
              </Badge>
            )}

            {isLow && !isOut && (
              <Badge className="rounded-xl border-none bg-amber-500/10 px-2.5 py-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                Stock bajo
              </Badge>
            )}
          </div>

          {/* Hint de acción */}
          <div className="mt-4 flex items-center justify-center">
            <p className="text-xs text-muted-foreground text-center">
              Click para ajustar inventario
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AlertDialog fuera del dropdown */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="rounded-3xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold tracking-tight">
              ¿Eliminar “{product.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Esta acción es irreversible. Se borrarán todos los registros de
              inventario y precios asociados a este producto.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
            <AlertDialogCancel className="h-12 rounded-2xl border-2 font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className={cn(
                "h-12 rounded-2xl bg-destructive font-black text-destructive-foreground hover:bg-destructive/90 active:scale-95",
                deleteProduct.isPending ? "pointer-events-none opacity-60" : ""
              )}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Eliminando...
                </span>
              ) : (
                "Sí, eliminar producto"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
