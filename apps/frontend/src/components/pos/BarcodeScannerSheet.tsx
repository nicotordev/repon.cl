"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";

const SCAN_COOLDOWN_MS = 2000;

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorInstance;
  }
}

function isBarcodeDetectorSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

interface BarcodeScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetect: (code: string) => void;
}

export function BarcodeScannerSheet({
  open,
  onOpenChange,
  onDetect,
}: BarcodeScannerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const lastCodeRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const [error, setError] = useState<string | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [supported] = useState(isBarcodeDetectorSupported());

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      setStreamReady(false);
      return;
    }

    if (!supported) {
      setError(
        "Escaneo por cámara no disponible en este navegador. Usa Chrome o Edge.",
      );
      return;
    }

    let cancelled = false;

    async function start() {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          if (!cancelled) setStreamReady(true);
        }

        if (!detectorRef.current && window.BarcodeDetector) {
          detectorRef.current = new window.BarcodeDetector({
            formats: [
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
              "code_93",
              "codabar",
              "itf",
              "qr_code",
            ],
          });
        }

        function detectLoop() {
          if (cancelled) return;
          const video = videoRef.current;
          const detector = detectorRef.current;
          if (!video || video.readyState < 2 || !detector) {
            rafRef.current = requestAnimationFrame(detectLoop);
            return;
          }
          detector
            .detect(video)
            .then((barcodes: { rawValue: string }[]) => {
              if (cancelled) return;
              const now = Date.now();
              for (const b of barcodes) {
                const code = b.rawValue?.trim();
                if (
                  code &&
                  (lastCodeRef.current !== code ||
                    now - lastTimeRef.current > SCAN_COOLDOWN_MS)
                ) {
                  lastCodeRef.current = code;
                  lastTimeRef.current = now;
                  onDetect(code);
                  onOpenChange(false);
                  return;
                }
              }
            })
            .catch(() => {});
          rafRef.current = requestAnimationFrame(detectLoop);
        }

        rafRef.current = requestAnimationFrame(detectLoop);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "No se pudo acceder a la cámara",
          );
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, supported, onDetect, onOpenChange, stopStream]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>Apunta al código de barras</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col items-center gap-4">
          {error && (
            <p className="text-destructive text-center text-sm">{error}</p>
          )}
          {supported && !error && (
            <div className="relative w-full overflow-hidden rounded-lg border border-border bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-primary/30 border-dashed rounded-lg pointer-events-none" />
            </div>
          )}
          {supported && !error && !streamReady && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              Iniciando cámara…
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
