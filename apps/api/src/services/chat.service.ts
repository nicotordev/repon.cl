import { generateText, experimental_transcribe as transcribe } from "ai";
import { google } from "@ai-sdk/google";
import { elevenlabs } from "@ai-sdk/elevenlabs";
import type { Context } from "hono";
import { getAuth } from "@hono/clerk-auth";
import userService from "./user.service.js";
import { GEMINI_FLASH_LATEST } from "../app.config.js";

function isFile(value: unknown): value is File {
  return typeof value === "object" && value !== null && value instanceof File;
}
const chatService = {
  voice: async (c: Context) => {
    const session = await getAuth(c);

    if (!session || !session.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await userService.getUserByClerkId(session.userId);

    const context = `
      ** Contexto **
      Nombre del usuario: ${user?.name}
      Email del usuario: ${user?.email}
      ID del usuario: ${user?.id}
    `;

    // Hono: multipart/form-data => parseBody() devuelve File | string por campo
    const body = await c.req.parseBody();
    const audio = body["audio"];

    if (!isFile(audio)) {
      return c.json(
        { error: 'Falta archivo "audio" (multipart/form-data).' },
        400,
      );
    }

    if (audio.size <= 0) {
      return c.json({ error: 'El archivo "audio" está vacío.' }, 400);
    }

    const allowedMimes = [
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "audio/x-wav",
    ];
    const mime = (audio.type || "").toLowerCase();
    const isValidMime =
      allowedMimes.some((t) => mime === t) ||
      mime.startsWith("audio/");
    if (!isValidMime && mime !== "") {
      return c.json(
        { error: `Tipo de audio no soportado: ${audio.type}. Use audio/webm u otro formato de audio.` },
        400,
      );
    }

    const audioBytes = new Uint8Array(await audio.arrayBuffer());

    // 1) STT con ElevenLabs (audio -> texto)
    const transcript = await transcribe({
      model: elevenlabs.transcription("scribe_v1"),
      audio: audioBytes,
    });

    const userText = transcript.text.trim();
    if (userText.length === 0) {
      return c.json({ transcript: "", response: "" }, 200);
    }

    // 2) “Cerebro” con Gemini (texto -> respuesta)
    const system =
      "Eres un copiloto de tienda. Responde corto, accionable y en español. " +
      "Si falta información, pide lo mínimo. Si el usuario pide una acción, devuélvela como pasos concretos.";

    const promptParts: string[] = [];
    if (context) promptParts.push(`Contexto:\n${context}`);
    promptParts.push(`Usuario (transcrito):\n${userText}`);

    const { text } = await generateText({
      model: google(GEMINI_FLASH_LATEST),
      system,
      prompt: promptParts.join("\n\n"),
    });

    return c.json({ transcript: userText, response: text }, 200);
  },
};

export default chatService;
