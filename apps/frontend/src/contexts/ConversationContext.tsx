"use client";

import type { ConversationMessage } from "@/lib/conversation-types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const STORAGE_KEY = "repon.cl/conversation-messages";

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

function getInitialMessages(): ConversationMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function persistMessages(messages: ConversationMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // noop
  }
}

export function ConversationProvider({
  children,
  onOpenChat,
}: {
  children: ReactNode;
  /** Called when openChat() is invoked; e.g. open the copilot sheet. */
  onOpenChat?: () => void;
}) {
  // Always start with [] so server and client first paint match (avoids hydration mismatch).
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  // After mount, load from localStorage (client-only; preserves hydration).
  useEffect(() => {
    if (typeof window === "undefined") return;
    setMessages(getInitialMessages());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

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
    persistMessages([]);
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
