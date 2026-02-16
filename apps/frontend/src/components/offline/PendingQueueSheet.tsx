"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatRelative } from "@/lib/dates";
import { removeFromQueue } from "@/lib/offlineQueue";
import { useOfflineStore } from "@/store/offline.store";
import { useUIStore } from "@/store/ui.store";

export function PendingQueueSheet() {
  const open = useUIStore((s) => s.sheetsOpen.includes("pending"));
  const closeSheet = useUIStore((s) => s.closeSheet);
  const refreshQueue = useOfflineStore((s) => s.refreshQueue);
  const queue = useOfflineStore((s) => s.queue);

  const handleRetry = () => {
    refreshQueue();
    // Placeholder: in real app would trigger sync
  };

  const handleDismiss = (id: string) => {
    removeFromQueue(id);
    refreshQueue();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeSheet("pending")}>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>Acciones pendientes</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {queue.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay acciones pendientes de sincronizar.
            </p>
          ) : (
            queue.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium capitalize">
                    {a.type.replace("_", " ")}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatRelative(a.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(a.id)}
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        {queue.length > 0 && (
          <Button className="mt-4 w-full" onClick={handleRetry}>
            Reintentar sincronización
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
