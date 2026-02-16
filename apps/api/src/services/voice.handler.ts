/**
 * Voice request handler.
 *
 * Flow: audio in → transcribe → resolve context (store, session, history) →
 * LLM stream with tools → stream NDJSON (meta, chunk, done) → log tool invocations when done.
 */
import type { Context } from "hono";
import { getAuth } from "@hono/clerk-auth";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import prisma from "../lib/prisma.js";
import { VoiceActionNameSchema, mapActionNameToType } from "../modules/voice/voice.contract.js";
import { VoiceActionStatus } from "../lib/generated/prisma/client.js";

import { MAX_AUDIO_BYTES, ALLOWED_AUDIO_MIME_TYPES } from "./voice.constants.js";
import {
  firstFile,
  firstString,
  safeTrim,
  isMimeAllowed,
} from "./voice.utils.js";
import { getVoiceRequestContext } from "./voice-context.service.js";
import { transcribeAudio } from "./transcription.service.js";
import {
  createVoiceStream,
  getToolInvocationsFromSteps,
} from "./voice-ai.service.js";

function jsonError(
  c: Context,
  status: ContentfulStatusCode,
  payload: { error: string; code?: string },
) {
  return c.json(payload, status);
}

export async function handleVoice(c: Context): Promise<Response> {
  try {
    const auth = await getAuth(c);
    const clerkUserId = auth?.userId;
    if (!clerkUserId) {
      return jsonError(c, 401, { error: "Unauthorized", code: "UNAUTHORIZED" });
    }

    const body = await c.req.parseBody();
    const audio = firstFile(body["audio"]);
    const requestedStoreId = firstString(body["storeId"]);
    const sessionId = firstString(body["sessionId"]);

    if (!audio) {
      return jsonError(c, 400, {
        error: 'Falta archivo "audio" (multipart/form-data).',
        code: "AUDIO_MISSING",
      });
    }
    if (audio.size <= 0) {
      return jsonError(c, 400, {
        error: 'El archivo "audio" está vacío.',
        code: "AUDIO_EMPTY",
      });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return jsonError(c, 413, {
        error: `El audio excede el límite (${Math.floor(MAX_AUDIO_BYTES / (1024 * 1024))}MB).`,
        code: "AUDIO_TOO_LARGE",
      });
    }
    if (!isMimeAllowed(audio.type, ALLOWED_AUDIO_MIME_TYPES)) {
      return jsonError(c, 415, {
        error: `Tipo de audio no soportado: "${audio.type}".`,
        code: "AUDIO_UNSUPPORTED_TYPE",
      });
    }

    // Start transcription, audio buffer read, and context resolution in parallel
    const audioBytesPromise = audio.arrayBuffer().then((buf) => new Uint8Array(buf));
    const contextPromise = getVoiceRequestContext({
      clerkUserId,
      requestedStoreId,
      sessionId,
    });

    // Start transcription as soon as we can (needs audioBytesPromise)
    const transcriptionPromise = audioBytesPromise.then((bytes) =>
      transcribeAudio(bytes),
    );

    const [contextResult, transcriptionResult] = await Promise.all([
      contextPromise,
      transcriptionPromise,
    ]);

    if (!contextResult.ok) {
      return c.json(
        {
          transcript: contextResult.payload.transcript,
          response: contextResult.payload.response,
        },
        contextResult.status,
      );
    }

    const { store, session, storeContext, conversationHistory } = contextResult;
    const { text: transcribedText, provider } = transcriptionResult;
    const userText = safeTrim(transcribedText);

    if (userText.length === 0) {
      // Log empty transcript in background
      prisma.voiceTranscript.create({
        data: { sessionId: session.id, inputText: "", provider },
      }).catch(err => console.error("[voice.handler] background transcript error:", err));

      return c.json(
        {
          sessionId: session.id,
          transcript: "",
          response: { type: "answer" as const, message: "" },
        },
        200,
      );
    }

    // Log transcript in background
    prisma.voiceTranscript.create({
      data: { sessionId: session.id, inputText: userText, provider },
    }).catch(err => console.error("[voice.handler] background transcript error:", err));

    let streamResult: ReturnType<typeof createVoiceStream>;
    try {
      streamResult = createVoiceStream({
        storeId: store.id,
        storeContext,
        userText,
        conversationHistory: conversationHistory ?? undefined,
      });
    } catch (err) {
      console.error("[voice.handler] createVoiceStream error:", err);
      return jsonError(c, 500, {
        error: "Error al iniciar la respuesta.",
        code: "INTERNAL_ERROR",
      });
    }

    const encoder = new TextEncoder();
    const enqueue = (controller: ReadableStreamDefaultController<Uint8Array>, line: string) => {
      controller.enqueue(encoder.encode(line + "\n"));
    };

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          enqueue(controller, JSON.stringify({
            type: "meta",
            sessionId: session.id,
            transcript: userText,
          }));

          for await (const chunk of streamResult.textStream) {
            enqueue(controller, JSON.stringify({ type: "chunk", text: chunk }));
          }

          const steps = await streamResult.steps;
          const toolInvocations = getToolInvocationsFromSteps(steps);
          const fullText = (await streamResult.text)?.trim() ?? (toolInvocations.length > 0 ? "Listo." : "");
          const now = new Date();

          if (toolInvocations.length > 0) {
            await Promise.all(toolInvocations.map(async (inv) => {
              const actionName = VoiceActionNameSchema.safeParse(inv.toolName);
              const name = actionName.success ? actionName.data : "other";
              await prisma.voiceAction.create({
                data: {
                  sessionId: session.id,
                  storeId: store.id,
                  type: mapActionNameToType(name),
                  status: VoiceActionStatus.EXECUTED,
                  intentName: inv.toolName,
                  parametersJson:
                    inv.input != null ? JSON.stringify(inv.input) : null,
                  resultJson:
                    inv.output != null ? JSON.stringify(inv.output) : null,
                  executedAt: now,
                },
              });
            }));
          } else {
            await prisma.voiceAction.create({
              data: {
                sessionId: session.id,
                storeId: store.id,
                type: mapActionNameToType("other"),
                status: VoiceActionStatus.EXECUTED,
                intentName: "answer",
                parametersJson: null,
                resultJson: JSON.stringify({ message: fullText }),
                executedAt: now,
              },
            });
          }

          enqueue(controller, JSON.stringify({ type: "done", message: fullText }));
        } catch (err) {
          console.error("[voice.handler] stream error:", err);
          const message = err instanceof Error ? err.message : "Error al generar la respuesta.";
          enqueue(controller, JSON.stringify({ type: "error", message }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    console.error("[voice.handler] error:", err);
    return c.json(
      {
        error: "Ha ocurrido un error procesando el audio.",
        code: "INTERNAL_ERROR",
      },
      500,
    );
  }
}
