"use client";

import { Button } from "@/components/ui/button";
import type { SuggestedAction } from "@/store/copilot.store";
import { useUIStore } from "@/store/ui.store";

export function SuggestedActions({
  suggestions,
}: {
  suggestions: SuggestedAction[];
}) {
  const openSheet = useUIStore((s) => s.openSheet);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">Acciones sugeridas</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((a) => (
          <Button
            key={a.id}
            variant="secondary"
            size="sm"
            onClick={() => openSheet("actionReview")}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
