"use client";

import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { StepConfig } from "./ProductFormStepIndicator";

interface ProductFormFooterProps {
  step: number;
  steps: readonly StepConfig[];
  isPending: boolean;
  isEdit: boolean;
  canGoNext: () => boolean;
  onOpenChange: (open: boolean) => void;
  onStepBack: () => void;
  onStepNext: () => void;
}

export function ProductFormFooter({
  step,
  steps,
  isPending,
  isEdit,
  canGoNext,
  onOpenChange,
  onStepBack,
  onStepNext,
}: ProductFormFooterProps) {
  return (
    <SheetFooter className="sticky bottom-0 mt-8 flex flex-row gap-3 border-t border-border/50 bg-background pt-4">
      {step === 1 ? (
        <>
          <Button
            type="button"
            variant="ghost"
            className="h-12 flex-1 rounded-2xl font-bold"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onStepNext}
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
            onClick={onStepBack}
            disabled={isPending}
          >
            <ChevronLeft className="mr-2 size-5" />
            Atrás
          </Button>
          <Button
            type="button"
            onClick={onStepNext}
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
            onClick={onStepBack}
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
  );
}
