"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TTS_ENDPOINT = `${API_BASE}/api/v1/chat/tts`;

export function useTts() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(
    async (text: string, messageId?: string) => {
      const trimmed = text?.trim() ?? "";
      if (!trimmed) return;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingMessageId(messageId ?? null);
      setProgress(0);
      setIsLoading(true);
      setIsPlaying(false);

      try {
        let token = await getToken();
        if (!token) {
          await new Promise((r) => setTimeout(r, 300));
          token = await getToken();
        }
        if (!token) {
          throw new Error("Inicia sesión para usar la voz");
        }
        const res = await fetch(TTS_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: trimmed }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof data.error === "string" ? data.error : "Error al generar audio",
          );
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audioRef.current = audio;

        const updateProgress = () => {
          if (audio.duration && isFinite(audio.duration)) {
            setProgress(audio.currentTime / audio.duration);
          }
        };

        audio.onplay = () => {
          setIsPlaying(true);
          updateProgress();
        };
        audio.ontimeupdate = updateProgress;
        audio.onended = () => {
          setProgress(1);
          setIsPlaying(false);
          setPlayingMessageId(null);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setProgress(0);
          setIsPlaying(false);
          setPlayingMessageId(null);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };

        await audio.play();
      } catch (err) {
        console.error("[useTts] error:", err);
        setIsLoading(false);
        setIsPlaying(false);
        setPlayingMessageId(null);
        setProgress(0);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getToken],
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlayingMessageId(null);
    setProgress(0);
  }, []);

  return { play, stop, isLoading, isPlaying, playingMessageId, progress };
}
