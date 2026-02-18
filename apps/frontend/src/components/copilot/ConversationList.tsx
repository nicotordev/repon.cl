"use client";

import { Button } from "@/components/ui/button";
import { AudioWaveform } from "@/components/copilot/AudioWaveform";
import { useConversationOptional } from "@/contexts/ConversationContext";
import { useTts } from "@/hooks/use-tts";
import type { ConversationMessage } from "@/lib/conversation-types";
import { cn } from "@/lib/utils";
import { Bot, MessageCircle, Trash2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function ChatBubble({
  msg,
  index,
  onPlayTts,
  isPlaying,
  isLoading,
  playingMessageId,
  progress,
}: {
  msg: ConversationMessage;
  index: number;
  onPlayTts?: (text: string, messageId: string) => void;
  isPlaying: boolean;
  isLoading: boolean;
  playingMessageId: string | null;
  progress: number;
}) {
  const isUser = msg.role === "user";
  const [showTranscript, setShowTranscript] = useState(false);

  // No auto-play in useEffect: audio.play() requires a user gesture (NotAllowedError otherwise).
  // User can tap the waveform to play.

  const isThisPlaying = playingMessageId === msg.id;

  return (
    <li
      className={cn(
        "chat-bubble-enter flex gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {isUser ? (
          <User className="size-4" aria-hidden />
        ) : (
          <Bot className="size-4" aria-hidden />
        )}
      </div>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5 rounded-2xl px-4 py-2.5 text-sm shadow-sm",
          isUser
            ? "rounded-tr-md bg-primary text-primary-foreground"
            : "rounded-tl-md bg-muted/80 text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        ) : (
          <>
            {msg.content.trim() && onPlayTts && (
              <AudioWaveform
                messageId={msg.id}
                isPlaying={isThisPlaying}
                isLoading={isLoading && isThisPlaying}
                progress={isThisPlaying ? progress : 0}
                onPlay={() => onPlayTts(msg.content, msg.id)}
                className="text-foreground/80"
              />
            )}
            {msg.content.trim() && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground -ml-1 h-7 text-xs"
                onClick={() => setShowTranscript((s) => !s)}
              >
                {showTranscript ? "Ocultar transcripción" : "Ver transcripción"}
              </Button>
            )}
            {showTranscript && (
              <p className="whitespace-pre-wrap break-words border-t border-border/50 pt-2 mt-0.5 text-foreground/90">
                {msg.content}
              </p>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export function ConversationList() {
  const conversation = useConversationOptional();
  const listEndRef = useRef<HTMLDivElement>(null);
  const {
    play: playTts,
    isPlaying,
    isLoading,
    playingMessageId,
    progress,
  } = useTts();

  useEffect(() => {
    if (conversation?.messages.length) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.messages.length]);

  if (!conversation) return null;

  const { messages, clearMessages } = conversation;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex items-center justify-between pb-2">
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
          <MessageCircle className="size-3.5" />
          Conversación
        </span>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs"
            onClick={clearMessages}
          >
            <Trash2 className="size-3.5" />
            Limpiar
          </Button>
        )}
      </div>
      <ul className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden py-1 pr-1">
        {messages.length === 0 ? (
          <li className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-sm">
            <div className="rounded-full bg-muted/50 p-4">
              <MessageCircle className="size-8" />
            </div>
            <p>Mantén el micrófono y habla para empezar.</p>
          </li>
        ) : (
          messages.map((msg, i) => (
            <ChatBubble
              key={msg.id}
              msg={msg}
              index={i}
              onPlayTts={playTts}
              isPlaying={isPlaying}
              isLoading={isLoading}
              playingMessageId={playingMessageId}
              progress={progress}
            />
          ))
        )}
        <div ref={listEndRef} />
      </ul>
    </div>
  );
}
