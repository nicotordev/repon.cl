import type { Context } from "hono";
import { generateSpeech } from "./tts.service.js";

const MAX_TEXT_LENGTH = 5000;

export async function handleTts(c: Context): Promise<Response> {
  try {
    const body = await c.req.json().catch(() => ({}));
    const text =
      typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return c.json(
        { error: "Falta el campo 'text' (string).", code: "TEXT_MISSING" },
        400,
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return c.json(
        {
          error: `El texto no puede superar ${MAX_TEXT_LENGTH} caracteres.`,
          code: "TEXT_TOO_LONG",
        },
        400,
      );
    }

    const audio = await generateSpeech(text);

    if (audio.length === 0) {
      return c.json(
        { error: "Texto vacío tras recortar.", code: "TEXT_EMPTY" },
        400,
      );
    }

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[tts.handler] error:", err);
    const message =
      err instanceof Error ? err.message : "Error al generar el audio.";
    return c.json({ error: message, code: "TTS_ERROR" }, 500);
  }
}
