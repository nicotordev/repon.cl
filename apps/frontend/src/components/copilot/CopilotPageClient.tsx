"use client";

import { ConversationList } from "@/components/copilot/ConversationList";
import { SuggestedActions } from "@/components/copilot/SuggestedActions";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { useCopilotStore } from "@/store/copilot.store";

export function CopilotPageClient() {
  const suggestions = useCopilotStore((s) => s.suggestions);

  return (
    <div className="flex h-[calc(100vh-8rem)] max-h-[700px] flex-col gap-0 px-4 pb-6">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="shrink-0 px-4 pt-4">
          <h1 className="text-lg font-semibold">Copilot</h1>
          <p className="text-muted-foreground text-sm">
            Habla con el asistente para tu negocio.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-4">
          <ConversationList />
        </div>
        <div className="shrink-0 border-t border-border/60 bg-muted/30 px-4 py-4">
          <VoiceButton className="w-full" />
        </div>
        {suggestions.length > 0 && (
          <div className="shrink-0 border-t border-border/60 px-4 pb-4">
            <SuggestedActions suggestions={suggestions} />
          </div>
        )}
      </div>
    </div>
  );
}
