"use client";

import { useUIStore } from "@/src/store/ui.store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";

export function ReceiptSheet() {
  const open = useUIStore((s) => s.sheetsOpen.includes("receipt"));
  const closeSheet = useUIStore((s) => s.closeSheet);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeSheet("receipt")}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Ticket</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground text-sm">
            Venta registrada correctamente.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Compartir
            </Button>
            <Button variant="outline" className="flex-1">
              Imprimir
            </Button>
          </div>
          <Button className="w-full" onClick={() => closeSheet("receipt")}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
