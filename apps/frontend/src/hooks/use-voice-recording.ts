"use client";

import { useCallback, useRef, useState } from "react";
import type {
  VoiceRecordingState,
  VoiceResult,
  VoiceState,
} from "@/src/lib/voice-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const VOICE_ENDPOINT = `${API_BASE}/api/v1/chat/voice`;

function getPreferredMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
    return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "";
}

const INITIAL_STATE: VoiceRecordingState = {
  state: "IDLE",
  error: null,
  result: null,
};

function setState(
  prev: VoiceRecordingState,
  updates: Partial<VoiceRecordingState>,
): VoiceRecordingState {
  return { ...prev, ...updates };
}

export function useVoiceRecording() {
  const [voiceState, setVoiceState] =
    useState<VoiceRecordingState>(INITIAL_STATE);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const transitionTo = useCallback(
    (state: VoiceState, extra?: Partial<VoiceRecordingState>) => {
      setVoiceState((prev) => setState(prev, { state, ...extra }));
    },
    [],
  );

  const startRecording = useCallback(async () => {
    if (voiceState.state !== "IDLE") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getPreferredMime() || undefined;
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100);
      recorderRef.current = recorder;
      transitionTo("RECORDING", { error: null, result: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo acceder al micrófono";
      transitionTo("ERROR", { error: message });
    }
  }, [voiceState.state, transitionTo]);

  const stopRecording = useCallback(async () => {
    if (voiceState.state !== "RECORDING" || !recorderRef.current) return;

    const recorder = recorderRef.current;
    recorderRef.current = null;
    stopStream();

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, {
                type: recorder.mimeType || "audio/webm",
              })
            : null;
        chunksRef.current = [];

        if (!blob || blob.size === 0) {
          transitionTo("IDLE", { error: null, result: null });
          resolve();
          return;
        }

        transitionTo("PROCESSING");

        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");

          const res = await fetch(VOICE_ENDPOINT, {
            method: "POST",
            body: form,
            credentials: "include",
          });

          const data = (await res.json()) as
            | { transcript: string; response: string }
            | { error: string };

          if (!res.ok) {
            const error = "error" in data ? data.error : "Error en el servidor";
            transitionTo("ERROR", { error });
            resolve();
            return;
          }

          const result: VoiceResult =
            "transcript" in data
              ? { transcript: data.transcript, response: data.response }
              : { transcript: "", response: "" };

          transitionTo("RESPONDING", { result, error: null });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error de red";
          transitionTo("ERROR", { error: message });
        }
        resolve();
      };

      if (recorder.state === "recording") recorder.stop();
      else resolve();
    });
  }, [voiceState.state, stopStream, transitionTo]);

  const reset = useCallback(() => {
    if (voiceState.state === "RECORDING" && recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      stopStream();
    }
    setVoiceState(INITIAL_STATE);
  }, [voiceState.state, stopStream]);

  return {
    state: voiceState.state,
    error: voiceState.error,
    result: voiceState.result,
    startRecording,
    stopRecording,
    reset,
  };
}
