"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useConversationOptional } from "@/contexts/ConversationContext";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/lib/voice-types";
import { MicIcon, SquareIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

function stateLabel(state: VoiceState): string {
  switch (state) {
    case "IDLE":
      return "Mantener para hablar";
    case "RECORDING":
      return "Soltar para enviar";
    case "PROCESSING":
      return "Procesando…";
    case "RESPONDING":
      return "Listo";
    case "ERROR":
      return "Reintentar";
    default:
      return "";
  }
}

export function VoiceButton({ className }: { className?: string }) {
  const conversation = useConversationOptional();
  const {
    state,
    error,
    result,
    streamingTranscript,
    streamingResponse,
    streamingThought,
    startRecording,
    stopRecording,
    reset,
  } = useVoiceRecording();

  const lastResultRef = useRef<typeof result>(null);

  // When we get a voice result, add it to the conversation and open the chat
  useEffect(() => {
    if (!result || !conversation) return;
    if (result === lastResultRef.current) return;
    lastResultRef.current = result;
    const userText = result.transcript?.trim() ?? "";
    const assistantText = result.response?.trim() ?? "";
    if (userText || assistantText) {
      conversation.addTurn(
        userText || "(audio)",
        assistantText || "(sin respuesta)",
      );
      conversation.openChat();
    }
    reset();
  }, [result, conversation, reset]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (state === "IDLE" || state === "ERROR") startRecording();
    },
    [state, startRecording],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (state === "RECORDING") stopRecording();
    },
    [state, stopRecording],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (state === "RECORDING") stopRecording();
    },
    [state, stopRecording],
  );

  const isProcessing = state === "PROCESSING";
  const isRecording = state === "RECORDING";
  const isError = state === "ERROR";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Button
        type="button"
        variant={isError ? "destructive" : "default"}
        size="lg"
        className={cn(
          "touch-none select-none rounded-full size-14 transition-all",
          isRecording &&
            "scale-110 bg-destructive text-primary-foreground hover:bg-destructive/90",
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => {
          e.preventDefault();
          if (state === "IDLE" || state === "ERROR") startRecording();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (state === "RECORDING") stopRecording();
        }}
        disabled={isProcessing}
        aria-label={stateLabel(state)}
        aria-busy={isProcessing}
      >
        {isProcessing ? (
          <Spinner className="size-6" />
        ) : isRecording ? (
          <SquareIcon className="size-6 fill-current" />
        ) : (
          <MicIcon className="size-6" />
        )}
      </Button>
      <span
        className={cn(
          "text-sm text-muted-foreground",
          isError && "text-destructive",
        )}
        role="status"
      >
        {error ?? stateLabel(state)}
      </span>
      {!conversation &&
        (streamingTranscript ||
          streamingResponse ||
          (result && (result.transcript || result.response))) && (
          <div className="w-full max-w-md space-y-2 rounded-lg border border-border bg-muted/50 p-3 text-sm">
            {(streamingTranscript ?? result?.transcript) && (
              <p>
                <span className="font-medium text-muted-foreground">Tú: </span>
                {streamingTranscript ?? result?.transcript}
              </p>
            )}
            {(streamingResponse ?? result?.response) && (
              <p>
                <span className="font-medium text-muted-foreground">
                  Respuesta:{" "}
                </span>
                {streamingResponse ?? result?.response}
                {state === "PROCESSING" && streamingResponse && (
                  <span
                    className="inline-block w-2 h-4 ml-0.5 bg-muted-foreground/60 animate-pulse"
                    aria-hidden
                  />
                )}
              </p>
            )}
            {streamingThought && (
              <p className="italic text-muted-foreground animate-pulse">
                {streamingThought}
              </p>
            )}
            {result && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Nueva grabación
              </Button>
            )}
          </div>
        )}
    </div>
  );
}
