"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteProduct } from "@/hooks/use-inventory";
import type { Product } from "@/lib/backend";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils"; // shadcn
import { useInventoryStore } from "@/store/inventory.store";
import { useUIStore } from "@/store/ui.store";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { PiPackage } from "react-icons/pi";
import { toast } from "sonner";

// Skeleton Loader for mutation states
function ProductCardSkeleton() {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-3xl border-border/60 bg-card py-0 opacity-70 pointer-events-none",
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

type ViewVariant = "grid" | "list";

export function ProductCard({
  product,
  variant = "grid",
}: {
  product: Product;
  variant?: ViewVariant;
}) {
  const setSelectedId = useInventoryStore((s) => s.setSelectedId);
  const setEditProductId = useInventoryStore((s) => s.setEditProductId);
  const openSheet = useUIStore((s) => s.openSheet);
  const removeFromStore = useDeleteProduct();

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

  const handleConfirmRemove = () => {
    removeFromStore.mutate(product.id, {
      onSuccess: () => {
        toast.success("Producto quitado de tu tienda");
        setShowDeleteAlert(false);
      },
      onError: (err) => {
        toast.error(err.message ?? "Error al quitar el producto");
      },
    });
  };

  const stockDotClass = isOut
    ? "bg-destructive"
    : isLow
      ? "bg-amber-500"
      : "bg-emerald-500";

  // Show skeleton while removing from store (mutation)
  if (removeFromStore.isPending) {
    return <ProductCardSkeleton />;
  }

  const isList = variant === "list";

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
          "group relative overflow-hidden border-border/60 bg-card",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isList
            ? "flex flex-row rounded-2xl py-0"
            : "rounded-3xl hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/5 active:translate-y-0 active:scale-[0.99] py-0",
        )}
      >
        {/* Media */}
        <div
          className={cn(
            "relative overflow-hidden shrink-0",
            isList ? "h-20 w-20" : "h-36 w-full",
          )}
        >
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
            <div className="relative z-[1] flex h-full w-full items-center justify-center p-1">
              <div
                className={cn(
                  "flex items-center justify-center rounded-xl bg-background/10 backdrop-blur-md",
                  isList
                    ? "size-full min-w-0 min-h-0"
                    : "gap-2 rounded-2xl px-4 py-2",
                )}
              >
                <PiPackage
                  className={cn(
                    "shrink-0 text-background/90",
                    isList ? "size-6" : "size-5",
                  )}
                />
                {!isList && (
                  <span className="text-xs font-semibold text-background/90">
                    Sin imagen
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Overlay Sin Stock solo en grid (en lista va en el contenido) */}
          {isOut && !isList && (
            <div className="absolute right-2 bottom-2 z-[2] grid place-items-center">
              <Badge
                variant="destructive"
                className="rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-tight"
              >
                Sin stock
              </Badge>
            </div>
          )}

          {/* Acciones: siempre visibles en móvil; en desktop al hover/focus */}
          <div
            className={cn(
              "absolute z-3 opacity-100 transition-opacity",
              isList ? "right-1 top-1" : "right-2 top-2 sm:right-3 sm:top-3",
            )}
          >
            <DropdownMenu>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Abrir acciones (Editar, Quitar)"
                onClick={(e) => e.stopPropagation()}
                asChild
              >
                <DropdownMenuTrigger>
                  <MoreHorizontal
                    className={cn(
                      isList ? "size-4" : "size-5",
                    )}
                  />
                </DropdownMenuTrigger>
              </Button>
              <DropdownMenuContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="w-48 rounded-2xl p-2 shadow-lg"
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
                  Quitar de mi tienda
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <CardContent
          className={cn(
            "p-3",
            isList &&
              "flex min-w-0 flex-1 flex-row items-center justify-between gap-3",
          )}
        >
          {isList ? (
            <>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-extrabold leading-tight text-foreground capitalize">
                  {product.name}
                </h3>
                {product.brand && (
                  <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                    {product.brand}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {product.category && (
                    <Badge
                      variant="secondary"
                      className="rounded-lg border-none bg-muted/50 px-2 py-0.5 text-[9px] font-bold text-muted-foreground"
                    >
                      {product.category}
                    </Badge>
                  )}
                  {isOut && (
                    <Badge
                      variant="destructive"
                      className="rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-tight"
                    >
                      Sin stock
                    </Badge>
                  )}
                  {isLow && !isOut && (
                    <Badge className="rounded-lg border-none bg-amber-500/10 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-400">
                      Stock bajo
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatMoney(product.salePriceGross ?? 0)}
                </p>
                <div className="flex items-center gap-1.5 rounded-xl bg-muted/40 px-2.5 py-1">
                  <span
                    className={cn("size-1.5 rounded-full", stockDotClass)}
                  />
                  <span className="text-[11px] font-bold text-foreground/80">
                    {stock}
                    <span className="ml-0.5 text-[9px] font-semibold text-muted-foreground">
                      {product.uom ?? "UNIT"}
                    </span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-1 text-base font-extrabold leading-tight text-foreground capitalize">
                    {product.name}
                  </h3>
                </div>

                {product.brand && (
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                    {product.brand}
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

              <div className="mt-4 flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center">
                  Click para ajustar inventario
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AlertDialog fuera del dropdown */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="rounded-3xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold tracking-tight">
              ¿Quitar “{product.name}” de tu tienda?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              El producto dejará de venderse en tu tienda y se quitarán su
              precio, imagen y stock de este local. El producto sigue existiendo
              en el catálogo y puedes volver a agregarlo más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
            <AlertDialogCancel className="h-12 rounded-2xl border-2 font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className={cn(
                "h-12 rounded-2xl bg-destructive font-black text-destructive-foreground hover:bg-destructive/90 active:scale-95",
                removeFromStore.isPending
                  ? "pointer-events-none opacity-60"
                  : "",
              )}
              disabled={removeFromStore.isPending}
            >
              {removeFromStore.isPending ? (
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
                  Quitando...
                </span>
              ) : (
                "Sí, quitar de mi tienda"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
