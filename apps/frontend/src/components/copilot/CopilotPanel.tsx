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
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Copilot</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-4">
          <ConversationList />
          <div className="flex justify-center">
            <VoiceButton />
          </div>
          <SuggestedActions suggestions={suggestions} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
