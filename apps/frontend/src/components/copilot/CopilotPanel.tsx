"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { useCopilotStore } from "@/store/copilot.store";
import { useUIStore } from "@/store/ui.store";
import { ConversationList } from "./ConversationList";
import { SuggestedActions } from "./SuggestedActions";

export function CopilotPanel() {
  const open = useUIStore((s) => s.sheetsOpen.includes("copilot"));
  const closeSheet = useUIStore((s) => s.closeSheet);
  const suggestions = useCopilotStore((s) => s.suggestions);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeSheet("copilot")}>
      <SheetContent
        side="bottom"
        className="flex h-[88vh] max-h-[88vh] flex-col gap-0 border-t p-0 sm:mx-auto sm:max-w-md sm:rounded-t-2xl"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-4 py-3">
          <SheetTitle className="text-base font-semibold">Copilot</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden px-4">
          <ConversationList />
          <SuggestedActions suggestions={suggestions} />
        </div>
        <div className="safe-area-pb shrink-0 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur supports-[padding:env(safe-area-inset-bottom)]:pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <VoiceButton className="w-full" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
