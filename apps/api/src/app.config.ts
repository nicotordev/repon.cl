/**
 * OpenAI model for voice/general AI.
 * Set OPENAI_MODEL in .env to override.
 * gpt-5.2 = best quality; gpt-4.1-mini / gpt-5-mini = cheaper, lower latency.
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
