"use client";

import { Mic } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useCopilotStore } from "@/src/store/copilot.store";
import { useUIStore } from "@/src/store/ui.store";
import { featureCopilot, featureVoice } from "@/src/lib/env";

export function CopilotDock() {
  const setMode = useCopilotStore((s) => s.setMode);
  const openSheet = useUIStore((s) => s.openSheet);

  if (!featureCopilot) return null;

  const handleOpen = () => {
    setMode("expanded");
    openSheet("copilot");
  };

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {featureVoice && (
        <Button
          size="icon"
          className="size-12 rounded-full shadow-lg"
          onClick={handleOpen}
        >
          <Mic className="size-5" />
        </Button>
      )}
    </div>
  );
}
