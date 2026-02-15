"use client";

import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { appName, featureOffline, featureCopilot, featureVoice } from "@/src/lib/env";

export function SettingsPageClient() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h2 className="mb-3 font-semibold">App</h2>
        <p className="text-muted-foreground text-sm">{appName}</p>
      </section>
      <section className="space-y-4">
        <h2 className="font-semibold">Funciones</h2>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="offline">Modo offline</Label>
          <Switch id="offline" checked={featureOffline} disabled />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="copilot">Copilot</Label>
          <Switch id="copilot" checked={featureCopilot} disabled />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="voice">Voz</Label>
          <Switch id="voice" checked={featureVoice} disabled />
        </div>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Moneda e impuestos</h2>
        <p className="text-muted-foreground text-sm">CLP — IVA 19% (configurable luego)</p>
      </section>
    </div>
  );
}
