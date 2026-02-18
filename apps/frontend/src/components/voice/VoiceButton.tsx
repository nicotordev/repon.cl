"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useConversationOptional } from "@/contexts/ConversationContext";
import { useTts } from "@/hooks/use-tts";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/lib/voice-types";
import { Bot, Loader2, Mic, Square, User, Volume2 } from "lucide-react";
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
  const { play: playTts, isLoading: ttsLoading, isPlaying: ttsPlaying } = useTts();

  const lastResultRef = useRef<typeof result>(null);

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
  const hasStreaming =
    streamingTranscript || streamingResponse || streamingThought;
  const hasResult = result && (result.transcript || result.response);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Streaming / current turn bubbles */}
      {(hasStreaming || hasResult) && (
        <div className="w-full space-y-2">
          {(streamingTranscript ?? result?.transcript) && (
            <div className="flex gap-2 justify-end">
              <div className="chat-bubble-enter max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                <span className="text-primary-foreground/80 text-xs font-medium">
                  Tú
                </span>
                <p className="whitespace-pre-wrap break-words">
                  {streamingTranscript ?? result?.transcript}
                </p>
              </div>
              <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs">
                <User className="size-4" />
              </div>
            </div>
          )}
          {(streamingResponse ?? result?.response) && (
            <div className="flex gap-2">
              <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs">
                <Bot className="size-4" />
              </div>
              <div className="flex max-w-[85%] flex-col gap-1 rounded-2xl rounded-tl-md bg-muted/80 px-4 py-2.5 text-sm text-foreground shadow-sm">
                <span className="text-muted-foreground text-xs font-medium">
                  Copilot
                </span>
                <p className="whitespace-pre-wrap break-words">
                  {streamingResponse ?? result?.response}
                  {state === "PROCESSING" && streamingResponse && (
                    <span className="typing-cursor" aria-hidden />
                  )}
                </p>
                {result?.response?.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground -ml-1 h-7 w-7 p-0"
                    onClick={() => playTts(result.response)}
                    disabled={ttsLoading}
                    aria-label={ttsPlaying ? "Reproduciendo" : "Escuchar respuesta"}
                  >
                    {ttsLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Volume2 className="size-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
          {streamingThought && (
            <p className="text-muted-foreground flex items-center gap-2 text-xs italic">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
              {streamingThought}
            </p>
          )}
          {result && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={reset}
            >
              Nueva grabación
            </Button>
          )}
        </div>
      )}

      {/* Mic bar */}
      <div className="flex w-full items-center justify-center gap-3">
        <Button
          type="button"
          variant={isError ? "destructive" : "default"}
          size="lg"
          className={cn(
            "touch-none select-none rounded-full transition-all duration-200",
            "size-14 sm:size-16",
            isRecording &&
              "animate-mic-recording scale-110 bg-destructive text-primary-foreground hover:bg-destructive/90",
            !isRecording &&
              !isError &&
              "animate-mic-pulse border-2 border-primary/30",
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
            <Spinner className="size-6 sm:size-7" />
          ) : isRecording ? (
            <Square className="size-6 fill-current sm:size-7" />
          ) : (
            <Mic className="size-6 sm:size-7" />
          )}
        </Button>
      </div>
      <span
        className={cn(
          "text-center text-sm text-muted-foreground",
          isError && "text-destructive",
        )}
        role="status"
      >
        {error ?? stateLabel(state)}
      </span>
    </div>
  );
}
