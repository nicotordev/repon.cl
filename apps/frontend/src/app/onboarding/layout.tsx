"use client";

import { Store } from "lucide-react";

/**
 * Onboarding layout: mobile Android-like, themed for minimarkets/retail.
 * Warm accent, store branding, safe areas.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="onboarding-bg flex min-h-dvh flex-col text-foreground"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/90 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
          <Store className="size-5" />
        </div>
        <div>
          <span className="font-semibold tracking-tight">Configura tu negocio</span>
          <p className="text-muted-foreground text-xs">Inventario, ventas y caja en un solo lugar</p>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-auto">
        <div className="mx-auto w-full max-w-md flex-1 px-4 py-5">
          {children}
        </div>
      </main>

      <div
        className="h-[env(safe-area-inset-bottom,0px)] min-h-2 shrink-0"
        aria-hidden
      />
    </div>
  );
}
