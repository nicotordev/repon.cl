"use client";

import { ConversationList } from "@/components/copilot/ConversationList";
import { SuggestedActions } from "@/components/copilot/SuggestedActions";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { useCopilotStore } from "@/store/copilot.store";

export function CopilotPageClient() {
  const suggestions = useCopilotStore((s) => s.suggestions);

  return (
    <div className="flex flex-col gap-6 p-4 pb-20">
      <section className="space-y-2">
        <h1 className="text-lg font-semibold">Copilot</h1>
        <p className="text-muted-foreground text-sm">
          Habla con el asistente para ayudarte con tu negocio.
        </p>
      </section>

      <ConversationList />

      <div className="flex justify-center">
        <VoiceButton />
      </div>

      <SuggestedActions suggestions={suggestions} />
    </div>
  );
}
