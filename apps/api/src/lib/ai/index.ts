import type { LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { OPENAI_MODEL } from "../../app.config.js";
import { buildVoiceTools } from "./tools.ai.js";
import { buildSystemPrompt } from "../../modules/voice/voice.prompt.js";

class ReponAI {
  private model: LanguageModel;
  private systemPrompt: string = buildSystemPrompt();

  constructor() {
    this.model = openai(OPENAI_MODEL);
  }

  /**
   * @param prompt - User or system prompt.
   * @param options.storeId - When set, voice action tools (add_stock, set_price, mark_expired, ask_metric) are available and the model can call them (maxSteps: 5).
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
      ...(tools && { tools, maxSteps: 5 }),
    });
    return result.text ?? "";
  }
}

export { ReponAI };
export { buildVoiceTools } from "./tools.ai.js";
