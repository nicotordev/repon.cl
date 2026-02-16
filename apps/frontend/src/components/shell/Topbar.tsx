"use client";

import { Bell, Loader2 } from "lucide-react";
import Logo from "../common/logo";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { usePathname } from "next/navigation";
import { useAlerts, useMarkAlertRead } from "@/src/hooks/use-alerts";
import type { StoreAlert } from "@/src/lib/alerts";
import { cn } from "@/src/lib/utils";

const titles: Record<string, string> = {
  "/pos": "Caja",
  "/inventory": "Inventario",
  "/reports": "Reportes",
  "/settings": "Ajustes",
  "/copilot": "Copilot",
};

function AlertItem({
  alert,
  onMarkRead,
  isMarking,
}: {
  alert: StoreAlert;
  onMarkRead: (id: string) => void;
  isMarking: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !alert.isRead && onMarkRead(alert.id)}
      disabled={isMarking}
      className={cn(
        "w-full rounded-lg border p-3 text-left text-sm transition-colors",
        alert.isRead
          ? "border-transparent bg-muted/30 text-muted-foreground"
          : "border-border bg-background hover:bg-muted/50",
      )}
    >
      <p className="font-semibold leading-tight">{alert.title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs">{alert.message}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {new Date(alert.createdAt).toLocaleDateString("es-CL", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </button>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const title = pathname ? (titles[pathname] ?? pathname.slice(1)) : "";
  const { data: alerts = [], isLoading } = useAlerts();
  const markRead = useMarkAlertRead();

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4">
      <Logo />
      <div className="flex items-center gap-2">
        {title && (
          <span className="text-muted-foreground text-sm">{title}</span>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b px-3 py-2">
              <h3 className="font-semibold text-sm">Notificaciones</h3>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-xs">Cargando...</span>
                </div>
              ) : alerts.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No hay notificaciones
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {alerts.map((a) => (
                    <AlertItem
                      key={a.id}
                      alert={a}
                      onMarkRead={markRead.mutate}
                      isMarking={markRead.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
