"use client";

import { usePathname } from "next/navigation";
import { appName } from "@/src/lib/env";

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
    <header className="sticky top-0 z-40 flex h-12 items-center border-b bg-background px-4">
      <h1 className="text-lg font-semibold">{appName}</h1>
      {title && (
        <span className="ml-2 text-muted-foreground text-sm">{title}</span>
      )}
    </header>
  );
}
