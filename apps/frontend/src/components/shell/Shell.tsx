"use client";

import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { PendingQueueSheet } from "@/components/offline/PendingQueueSheet";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { featureCopilot, featureOffline } from "@/lib/env";
import { useUIStore } from "@/store/ui.store";
import { usePathname } from "next/navigation";
import { MobileNav } from "./MobileNav";
import { Topbar } from "./Topbar";

export function Shell({ children }: { children: React.ReactNode }) {
  const openSheet = useUIStore((s) => s.openSheet);
  const pathname = usePathname();

  const handleOpenChat = () => {
    if (pathname === "/copilot" || pathname?.startsWith("/copilot/")) {
      return;
    }
    openSheet("copilot");
  };

  return (
    <StoreProvider>
      <ConversationProvider onOpenChat={handleOpenChat}>
      <div className="flex min-h-dvh flex-col bg-background">
        <Topbar />
        <main className="flex-1 overflow-auto pb-20 pt-10">
          {featureOffline && <OfflineBanner />}
          {children}
        </main>
        <MobileNav />
        {featureOffline && <PendingQueueSheet />}
        {featureCopilot && <CopilotPanel />}
      </div>
    </ConversationProvider>
    </StoreProvider>
  );
}
