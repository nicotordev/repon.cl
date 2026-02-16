"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import OneSignal from "react-onesignal";

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const initRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !APP_ID) return;
    if (initRef.current) return;
    initRef.current = true;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    OneSignal.init({
      appId: APP_ID,
      allowLocalhostAsSecureOrigin: isLocalhost,
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      serviceWorkerUpdaterPath: "/OneSignalSDKWorker.js",
    })
      .then(() => setReady(true))
      .catch((err) => {
        console.error("[OneSignal] init failed:", err);
        initRef.current = false;
      });
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (userId) {
      OneSignal.login(userId).catch((err) => {
        console.warn("[OneSignal] login failed:", err);
      });
    } else {
      OneSignal.logout().catch(() => {});
    }
  }, [ready, userId]);

  return <>{children}</>;
}
