import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { GEMINI_FLASH_LATEST } from "../app.config.js";
import type { VoiceModelOutput } from "../modules/voice/voice.contract.js";
import { VoiceModelOutputSchema } from "../modules/voice/voice.contract.js";
import {
  buildSystemPrompt,
  buildUserPrompt,
} from "../modules/voice/voice.prompt.js";

function safeJsonParse(input: string): unknown {
  return JSON.parse(input.trim());
}

export type VoiceTurnSuccess = { success: true; output: VoiceModelOutput };
export type VoiceTurnFailure = {
  success: false;
  raw?: string;
  message?: string;
};
export type VoiceTurnResult = VoiceTurnSuccess | VoiceTurnFailure;

export async function runVoiceTurn(args: {
  storeContext: string;
  userText: string;
  conversationHistory?: string;
}): Promise<VoiceTurnResult> {
  const system = buildSystemPrompt();
  const prompt = buildUserPrompt({
    storeContext: args.storeContext,
    userText: args.userText,
    conversationHistory: args.conversationHistory || undefined,
  });

  let modelTextRaw: string;
  try {
    const result = await generateText({
      model: google(GEMINI_FLASH_LATEST),
      system,
      prompt,
    });
    modelTextRaw = result.text ?? "";
  } catch (err) {
    console.error("[voice-ai.service] generateText error:", err);
    return {
      success: false,
      message: "Error al generar la respuesta.",
    };
  }

  const parsed = VoiceModelOutputSchema.safeParse(safeJsonParse(modelTextRaw));
  if (parsed.success) {
    return { success: true, output: parsed.data };
  }
  return {
    success: false,
    raw: modelTextRaw,
    message: "El modelo no devolvió JSON válido según el contrato.",
  };
}
