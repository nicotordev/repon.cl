import type { LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { OPENAI_MODEL } from "../../app.config.js";
import { buildVoiceTools } from "./tools.ai.js";
import { buildSystemPrompt } from "../../modules/voice/voice.prompt.js";

const VOICE_MAX_STEPS = Math.max(
  1,
  Math.min(8, Number(process.env.VOICE_MAX_STEPS ?? 3) || 3),
);

class ReponAI {
  private model: LanguageModel;
  private systemPrompt: string = buildSystemPrompt();

  constructor() {
    this.model = openai(OPENAI_MODEL);
  }

  /**
   * @param prompt - User or system prompt.
   * @param options.storeId - When set, voice action tools are available and the model can call them (maxSteps configurable with VOICE_MAX_STEPS, default 3).
   */
  async generateText(
    prompt: string,
    options?: { storeId?: string },
  ): Promise<string> {
    const tools = options?.storeId
      ? buildVoiceTools(options.storeId)
      : undefined;
    const result = await generateText({
      model: this.model,
      prompt,
      system: this.systemPrompt,
      ...(tools && { tools, maxSteps: VOICE_MAX_STEPS }),
    });
    return result.text ?? "";
  }
}

export { ReponAI };
export { buildVoiceTools } from "./tools.ai.js";
