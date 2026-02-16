import { google } from "@ai-sdk/google";
import { generateText, stepCountIs, streamText } from "ai";
import type { StreamTextResult } from "ai";
import { GEMINI_FLASH_LATEST } from "../app.config.js";
import { buildVoiceTools } from "../lib/ai/tools.ai.js";
import {
  buildSystemPrompt,
  buildUserPrompt,
} from "../modules/voice/voice.prompt.js";

export type VoiceToolInvocation = {
  toolName: string;
  input: unknown;
  output: unknown;
};

export type VoiceTurnSuccess = {
  success: true;
  text: string;
  toolInvocations: VoiceToolInvocation[];
};
export type VoiceTurnFailure = {
  success: false;
  message?: string;
  raw?: string;
};
export type VoiceTurnResult = VoiceTurnSuccess | VoiceTurnFailure;

const MAX_STEPS = 5;

export async function runVoiceTurn(args: {
  storeId: string;
  storeContext: string;
  userText: string;
  conversationHistory?: string;
}): Promise<VoiceTurnResult> {
  const system = buildSystemPrompt();
  const prompt = buildUserPrompt({
    storeContext: args.storeContext,
    userText: args.userText,
    conversationHistory: args.conversationHistory ?? undefined,
  });

  try {
    const result = await generateText({
      model: google(GEMINI_FLASH_LATEST),
      system,
      prompt,
      tools: buildVoiceTools(args.storeId),
      stopWhen: stepCountIs(MAX_STEPS),
    });

    const text = (result.text ?? "").trim();
    const toolInvocations: VoiceToolInvocation[] = [];

    for (const step of result.steps ?? []) {
      const calls = step.toolCalls ?? [];
      const results = step.toolResults ?? [];
      for (const tr of results) {
        const call = calls.find((c) => c.toolCallId === tr.toolCallId);
        toolInvocations.push({
          toolName: tr.toolName,
          input: call?.input ?? null,
          output: tr.output,
        });
      }
    }

    return {
      success: true,
      text: text || (toolInvocations.length > 0 ? "Listo." : ""),
      toolInvocations,
    };
  } catch (err) {
    console.error("[voice-ai.service] generateText error:", err);
    return {
      success: false,
      message: "Error al generar la respuesta.",
    };
  }
}

/** Extract tool invocations from streamText steps for logging. */
export function getToolInvocationsFromSteps(
  steps: Array<{ toolCalls?: Array<{ toolCallId: string; toolName: string; input: unknown }>; toolResults?: Array<{ toolCallId: string; toolName: string; output: unknown }> }>,
): VoiceToolInvocation[] {
  const out: VoiceToolInvocation[] = [];
  for (const step of steps) {
    const calls = step.toolCalls ?? [];
    const results = step.toolResults ?? [];
    for (const tr of results) {
      const call = calls.find((c) => c.toolCallId === tr.toolCallId);
      out.push({
        toolName: tr.toolName,
        input: call?.input ?? null,
        output: tr.output,
      });
    }
  }
  return out;
}

/**
 * Creates a streaming voice turn. Returns the streamText result so the handler
 * can pipe textStream to the response and then await steps for tool logging.
 */
export function createVoiceStream(args: {
  storeId: string;
  storeContext: string;
  userText: string;
  conversationHistory?: string;
}): StreamTextResult<ReturnType<typeof buildVoiceTools>, never> {
  const system = buildSystemPrompt();
  const prompt = buildUserPrompt({
    storeContext: args.storeContext,
    userText: args.userText,
    conversationHistory: args.conversationHistory ?? undefined,
  });

  return streamText({
    model: google(GEMINI_FLASH_LATEST),
    system,
    prompt,
    tools: buildVoiceTools(args.storeId),
    stopWhen: stepCountIs(MAX_STEPS),
  });
}
