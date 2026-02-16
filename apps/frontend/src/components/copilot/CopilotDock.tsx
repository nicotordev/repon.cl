"use client";

import { Button } from "@/components/ui/button";
import { featureCopilot, featureVoice } from "@/lib/env";
import { useCopilotStore } from "@/store/copilot.store";
import { useUIStore } from "@/store/ui.store";
import { Mic } from "lucide-react";

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
