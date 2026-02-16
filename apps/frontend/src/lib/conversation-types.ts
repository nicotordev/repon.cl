/**
 * A single message in the voice/copilot conversation.
 */
export type MessageRole = "user" | "assistant";

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** ISO timestamp */
  createdAt: string;
}

/**
 * One voice turn: user said something, assistant replied.
 * Stored as two messages but can be created in one call.
 */
export interface ConversationTurn {
  userMessage: ConversationMessage;
  assistantMessage: ConversationMessage;
}
