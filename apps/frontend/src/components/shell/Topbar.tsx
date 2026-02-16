"use client";

import { usePathname } from "next/navigation";
import { appName } from "@/src/lib/env";
import Logo from "../common/logo";
import { Button } from "../ui/button";
import { Bell } from "lucide-react";

const titles: Record<string, string> = {
  "/pos": "Caja",
  "/inventory": "Inventario",
  "/reports": "Reportes",
  "/settings": "Ajustes",
};

export function Topbar() {
  const pathname = usePathname();
  const title = pathname ? titles[pathname] ?? pathname.slice(1) : "";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4">
      <Logo />
      <div className="flex items-center gap-2">
        {title && (
          <span className="text-muted-foreground text-sm">{title}</span>
        )}
        <Button variant="outline" size="icon">
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
