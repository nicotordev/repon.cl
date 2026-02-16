"use client";

import { featureOffline } from "@/lib/env";
import { useOfflineStore } from "@/store/offline.store";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || !featureOffline || isOnline) return null;

  return (
    <div className="bg-amber-500/90 px-4 py-2 text-center text-sm font-medium text-amber-950">
      Modo sin conexión — Los cambios se guardarán al reconectar
    </div>
  );
}
