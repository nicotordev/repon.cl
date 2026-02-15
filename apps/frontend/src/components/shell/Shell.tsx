"use client";

import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { featureOffline, featureCopilot } from "@/src/lib/env";
import { OfflineBanner } from "@/src/components/offline/OfflineBanner";
import { PendingQueueSheet } from "@/src/components/offline/PendingQueueSheet";
import { CopilotDock } from "@/src/components/copilot/CopilotDock";
import { CopilotPanel } from "@/src/components/copilot/CopilotPanel";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Topbar />
      <main className="flex-1 overflow-auto pb-20">
        {featureOffline && <OfflineBanner />}
        {children}
      </main>
      <MobileNav />
      {featureOffline && <PendingQueueSheet />}
      {featureCopilot && (
        <>
          <CopilotDock />
          <CopilotPanel />
        </>
      )}
    </div>
  );
}
