"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

const APP_ID: string | undefined = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const SAFARI_WEB_ID: string | undefined =
  process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID;

type OneSignalInitOptions = Readonly<{
  appId: string;
  safari_web_id?: string;
  allowLocalhostAsSecureOrigin?: boolean;
  serviceWorkerPath?: string;
  serviceWorkerParam?: { scope?: string };
}>;

type OneSignalNotificationsNamespace = Readonly<{
  permission: "default" | "granted" | "denied";
  requestPermission: () => Promise<void>;
  // Alternativa más “soft” para prompts gestionados por OneSignal dashboard
  // promptPush: () => Promise<void>;
}>;

type OneSignalApi = Readonly<{
  init: (options: OneSignalInitOptions) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  Notifications: OneSignalNotificationsNamespace;
}>;

type OneSignalDeferredCallback = (
  oneSignal: OneSignalApi,
) => void | Promise<void>;

function isOneSignalApi(value: unknown): value is OneSignalApi {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["init"] === "function" &&
    typeof v["login"] === "function" &&
    typeof v["logout"] === "function" &&
    typeof v["Notifications"] === "object" &&
    v["Notifications"] !== null
  );
}

declare global {
  interface Window {
    OneSignalDeferred?: OneSignalDeferredCallback[];
  }
}

function ensureOneSignalScriptLoaded(): void {
  // OneSignal v16 recomienda usar el script "page.js" con defer. :contentReference[oaicite:2]{index=2}
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-onesignal-sdk="v16"]',
  );
  if (existing) return;

  const script = document.createElement("script");
  script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  script.defer = true;
  script.setAttribute("data-onesignal-sdk", "v16");
  document.head.appendChild(script);
}

function runWithOneSignal(
  fn: (os: OneSignalApi) => void | Promise<void>,
): void {
  window.OneSignalDeferred = window.OneSignalDeferred ?? [];
  window.OneSignalDeferred.push(async (maybeOs: unknown) => {
    if (!isOneSignalApi(maybeOs)) {
      // Si esto pasa, algo está muy fuera de spec: evitamos romper la app.
      console.warn("[OneSignal] SDK loaded but API shape was unexpected.");
      return;
    }
    await fn(maybeOs);
  });
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();

  const [ready, setReady] = useState(false);
  const initializedRef = useRef(false);

  const isLocalhost = useMemo(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }, []);

  // 1) Load script + init once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!APP_ID) {
      console.warn("[OneSignal] Missing NEXT_PUBLIC_ONESIGNAL_APP_ID");
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    ensureOneSignalScriptLoaded();

    runWithOneSignal(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: APP_ID,
          ...(SAFARI_WEB_ID ? { safari_web_id: SAFARI_WEB_ID } : {}),
          allowLocalhostAsSecureOrigin: isLocalhost,
          // 👇 IMPORTANT: tu SW debe estar en /public con este nombre:
          // /public/OneSignalSDKWorker.js
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" },
        });
        setReady(true);
      } catch (err: unknown) {
        console.error("[OneSignal] init failed:", err);
        initializedRef.current = false;
      }
    });
  }, [isLocalhost]);

  // 2) Link/unlink user (External ID) safely AFTER init
  useEffect(() => {
    if (!ready) return;

    runWithOneSignal(async (OneSignal) => {
      try {
        if (typeof userId === "string" && userId.length > 0) {
          await OneSignal.login(userId);
        } else {
          await OneSignal.logout();
        }
      } catch (err: unknown) {
        console.warn("[OneSignal] login/logout failed:", err);
      }
    });
  }, [ready, userId]);

  // 3) Permission request (guarded)
  useEffect(() => {
    if (!ready) return;

    runWithOneSignal(async (OneSignal) => {
      try {
        // Evita spamear prompts si ya está decidido
        if (OneSignal.Notifications.permission === "default") {
          await OneSignal.Notifications.requestPermission();
        }
      } catch (err: unknown) {
        console.warn("[OneSignal] permission request failed:", err);
      }
    });
  }, [ready]);

  return <>{children}</>;
}
