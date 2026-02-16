"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ConversationMessage } from "@/src/lib/conversation-types";

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type ConversationContextValue = {
  /** All messages in chronological order (user and assistant). */
  messages: ConversationMessage[];
  /** Append one voice turn: user transcript + assistant response. */
  addTurn: (userText: string, assistantText: string) => void;
  /** Clear all messages. */
  clearMessages: () => void;
  /** Open the chat/copilot UI (e.g. sheet). Call after addTurn to show the conversation. */
  openChat: () => void;
};

const ConversationContext = createContext<ConversationContextValue | null>(
  null,
);

export function ConversationProvider({
  children,
  onOpenChat,
}: {
  children: ReactNode;
  /** Called when openChat() is invoked; e.g. open the copilot sheet. */
  onOpenChat?: () => void;
}) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  const addTurn = useCallback((userText: string, assistantText: string) => {
    const now = new Date().toISOString();
    const userMessage: ConversationMessage = {
      id: generateId(),
      role: "user",
      content: userText.trim(),
      createdAt: now,
    };
    const assistantMessage: ConversationMessage = {
      id: generateId(),
      role: "assistant",
      content: assistantText.trim(),
      createdAt: now,
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const openChat = useCallback(() => {
    onOpenChat?.();
  }, [onOpenChat]);

  const value = useMemo(
    () => ({
      messages,
      addTurn,
      clearMessages,
      openChat,
    }),
    [messages, addTurn, clearMessages, openChat],
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation(): ConversationContextValue {
  const ctx = useContext(ConversationContext);
  if (!ctx) {
    throw new Error(
      "useConversation must be used within a ConversationProvider",
    );
  }
  return ctx;
}

/** Safe hook: returns null if outside provider. */
export function useConversationOptional(): ConversationContextValue | null {
  return useContext(ConversationContext);
}
