import { experimental_transcribe as transcribe } from "ai";
import { elevenlabs } from "@ai-sdk/elevenlabs";

const PROVIDER = "elevenlabs:scribe_v1";

export async function transcribeAudio(
  audioBytes: Uint8Array,
): Promise<{ text: string; provider: string }> {
  const result = await transcribe({
    model: elevenlabs.transcription("scribe_v1"),
    audio: audioBytes,
  });
  return {
    text: result.text?.trim() ?? "",
    provider: PROVIDER,
  };
}
