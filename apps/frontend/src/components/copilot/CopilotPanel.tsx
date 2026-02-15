"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { useUIStore } from "@/src/store/ui.store";
import { useCopilotStore } from "@/src/store/copilot.store";
import { TranscriptPreview } from "./TranscriptPreview";
import { SuggestedActions } from "./SuggestedActions";
import { VoiceButton } from "@/src/components/voice/VoiceButton";

export function CopilotPanel() {
  const open = useUIStore((s) => s.sheetsOpen.includes("copilot"));
  const closeSheet = useUIStore((s) => s.closeSheet);
  const transcript = useCopilotStore((s) => s.transcript);
  const suggestions = useCopilotStore((s) => s.suggestions);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeSheet("copilot")}>
      <SheetContent side="bottom" className="max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>Copilot</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex justify-center">
            <VoiceButton />
          </div>
          <TranscriptPreview text={transcript} />
          <SuggestedActions suggestions={suggestions} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
