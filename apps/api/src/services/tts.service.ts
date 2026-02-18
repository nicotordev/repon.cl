/**
 * Text-to-speech via ElevenLabs API.
 * Uses ELEVENLABS_API_KEY; optional ELEVENLABS_VOICE_ID (default: Rachel).
 */
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const DEFAULT_MODEL = "eleven_multilingual_v2";

export async function generateSpeech(text: string): Promise<Uint8Array> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID;
  const trimmed = text.trim();
  if (!trimmed) {
    return new Uint8Array(0);
  }

  const res = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: trimmed,
        model_id: DEFAULT_MODEL,
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error("[tts.service] ElevenLabs error:", res.status, errText);
    throw new Error(
      res.status === 401
        ? "TTS no autorizado"
        : res.status === 429
          ? "Límite de TTS alcanzado"
          : "Error al generar audio",
    );
  }

  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}
