"use client";

import { featureCopilot } from "@/lib/env";
import { cn } from "@/lib/utils";
import { BarChart3, LayoutGrid, Mic, Package, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { path: string; label: string; icon: React.ElementType };

const baseTabs: Tab[] = [
  { path: "/pos", label: "POS", icon: LayoutGrid },
  { path: "/inventory", label: "Inventario", icon: Package },
  { path: "/reports", label: "Reportes", icon: BarChart3 },
  { path: "/settings", label: "Ajustes", icon: Settings },
];

const tabs: Tab[] = featureCopilot
  ? [
      ...baseTabs.slice(0, 1),
      { path: "/copilot", label: "Copilot", icon: Mic },
      ...baseTabs.slice(1),
    ]
  : baseTabs;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background">
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = pathname === path || pathname?.startsWith(`${path}/`);
        return (
          <Link
            key={path}
            href={path}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
