"use client";

import { useCallback, useRef, useState } from "react";
import type {
  VoiceApiErrorBody,
  VoiceRecordingState,
  VoiceResult,
  VoiceState,
} from "@/src/lib/voice-types";
import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const VOICE_ENDPOINT = `${API_BASE}/api/v1/chat/voice`;

export interface UseVoiceRecordingOptions {
  /** ID de la tienda sobre la que actuar; si no se envía, el backend usa la tienda por defecto */
  storeId?: string;
}

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
  streamingTranscript: null,
  streamingResponse: null,
  streamingThought: null,
};

function setState(
  prev: VoiceRecordingState,
  updates: Partial<VoiceRecordingState>,
): VoiceRecordingState {
  return { ...prev, ...updates };
}

export function useVoiceRecording(options: UseVoiceRecordingOptions = {}) {
  const { getToken } = useAuth();
  const { storeId } = options;
  const [voiceState, setVoiceState] =
    useState<VoiceRecordingState>(INITIAL_STATE);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<string | null>(null);

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
      transitionTo("RECORDING", { error: null, result: null, streamingTranscript: null, streamingResponse: null, streamingThought: null });
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
          transitionTo("IDLE", { error: null, result: null, streamingTranscript: null, streamingResponse: null, streamingThought: null });
          resolve();
          return;
        }

        transitionTo("PROCESSING", { streamingTranscript: null, streamingResponse: null, streamingThought: null });

        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          if (storeId) form.append("storeId", storeId);
          if (sessionIdRef.current)
            form.append("sessionId", sessionIdRef.current);

          const token = await getToken();

          const res = await fetch(VOICE_ENDPOINT, {
            method: "POST",
            body: form,
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          });

          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as VoiceApiErrorBody;
            const errorMessage =
              typeof data.error === "string" && data.error
                ? data.error
                : res.status === 401
                  ? "No autorizado"
                  : res.status === 413
                    ? "El audio excede el límite (15MB)."
                    : res.status === 415
                      ? "Tipo de audio no soportado."
                      : "Error en el servidor";
            transitionTo("ERROR", { error: errorMessage });
            resolve();
            return;
          }

          const contentType = res.headers.get("content-type") ?? "";
          if (contentType.includes("application/x-ndjson") && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let transcript = "";
            let fullMessage = "";
            let streamFinished = false;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const obj = JSON.parse(line) as
                    | { type: "meta"; sessionId?: string; transcript?: string }
                    | { type: "chunk"; text?: string }
                    | { type: "thought"; text?: string }
                    | { type: "done"; message?: string }
                    | { type: "error"; message?: string };

                  if (obj.type === "meta") {
                    if (typeof obj.sessionId === "string" && obj.sessionId)
                      sessionIdRef.current = obj.sessionId;
                    transcript = typeof obj.transcript === "string" ? obj.transcript : "";
                    setVoiceState((prev) => setState(prev, { streamingTranscript: transcript }));
                  } else if (obj.type === "chunk" && typeof obj.text === "string") {
                    fullMessage += obj.text;
                    setVoiceState((prev) =>
                      setState(prev, { streamingResponse: fullMessage, streamingThought: null }),
                    );
                  } else if (obj.type === "thought" && typeof obj.text === "string") {
                    setVoiceState((prev) => setState(prev, { streamingThought: obj.text ?? null }));
                  } else if (obj.type === "done") {
                    streamFinished = true;
                    const message = typeof obj.message === "string" ? obj.message : fullMessage;
                    transitionTo("RESPONDING", {
                      result: { transcript, response: message },
                      error: null,
                      streamingTranscript: null,
                      streamingResponse: null,
                      streamingThought: null,
                    });
                  } else if (obj.type === "error") {
                    streamFinished = true;
                    const msg = typeof obj.message === "string" ? obj.message : "Error en el servidor";
                    transitionTo("ERROR", { error: msg, streamingTranscript: null, streamingResponse: null, streamingThought: null });
                  }
                } catch {
                  // ignore malformed lines
                }
              }
            }

            if (!streamFinished && fullMessage) {
              transitionTo("RESPONDING", {
                result: { transcript, response: fullMessage },
                error: null,
                streamingTranscript: null,
                streamingResponse: null,
                streamingThought: null,
              });
            }
          } else {
            const data = (await res.json().catch(() => ({}))) as {
              sessionId?: string;
              transcript?: string;
              response?: { type: "answer"; message: string } | string;
            };
            if (typeof data.sessionId === "string" && data.sessionId)
              sessionIdRef.current = data.sessionId;
            const responsePayload = data.response;
            const message =
              responsePayload &&
              typeof responsePayload === "object" &&
              "message" in responsePayload
                ? (responsePayload as { message: string }).message
                : typeof responsePayload === "string"
                  ? responsePayload
                  : "";
            transitionTo("RESPONDING", {
              result: {
                transcript: typeof data.transcript === "string" ? data.transcript : "",
                response: message,
              },
              error: null,
              streamingTranscript: null,
              streamingResponse: null,
              streamingThought: null,
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error de red";
          transitionTo("ERROR", { error: message, streamingTranscript: null, streamingResponse: null, streamingThought: null });
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
    streamingTranscript: voiceState.streamingTranscript,
    streamingResponse: voiceState.streamingResponse,
    streamingThought: voiceState.streamingThought,
    startRecording,
    stopRecording,
    reset,
  };
}
