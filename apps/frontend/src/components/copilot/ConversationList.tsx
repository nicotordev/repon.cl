"use client";

import { useConversationOptional } from "@/src/contexts/ConversationContext";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export function ConversationList() {
  const conversation = useConversationOptional();
  if (!conversation || conversation.messages.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">
          Conversación
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={conversation.clearMessages}
        >
          Limpiar
        </Button>
      </div>
      <ul className="flex max-h-[40vh] flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/10 p-3">
        {conversation.messages.map((msg) => (
          <li
            key={msg.id}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              msg.role === "user"
                ? "ml-0 mr-8 bg-primary/10 text-foreground"
                : "ml-8 mr-0 bg-muted/50 text-foreground",
            )}
          >
            <span className="text-muted-foreground mr-2 text-xs font-medium">
              {msg.role === "user" ? "Tú" : "Copilot"}:
            </span>
            {msg.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
