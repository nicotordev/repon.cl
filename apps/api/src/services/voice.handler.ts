/**
 * Voice request handler.
 *
 * Loop: audio in → transcribe → resolve context (store, session, history) →
 * LLM decides (answer | clarification | action) → execute actions if any →
 * build response → response out.
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
import { runVoiceTurn } from "./voice-ai.service.js";
import { executeVoiceAction } from "./voice-action.service.js";

function jsonError(
  c: Context,
  status: ContentfulStatusCode,
  payload: { error: string; code?: string },
) {
  return c.json(payload, status);
}

export async function handleVoice(c: Context): Promise<Response> {
  try {
    const auth = getAuth(c);
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

    const contextResult = await getVoiceRequestContext({
      clerkUserId,
      requestedStoreId,
      sessionId,
    });

    if (!contextResult.ok) {
      return c.json(
        { transcript: contextResult.payload.transcript, response: contextResult.payload.response },
        contextResult.status,
      );
    }

    const { store, session, storeContext, conversationHistory } = contextResult;
    const audioBytes = new Uint8Array(await audio.arrayBuffer());
    const { text: transcribedText, provider } = await transcribeAudio(audioBytes);
    const userText = safeTrim(transcribedText);

    if (userText.length === 0) {
      await prisma.voiceTranscript.create({
        data: { sessionId: session.id, inputText: "", provider },
      });
      return c.json(
        { sessionId: session.id, transcript: "", response: { type: "answer" as const, message: "" } },
        200,
      );
    }

    await prisma.voiceTranscript.create({
      data: { sessionId: session.id, inputText: userText, provider },
    });

    const turnResult = await runVoiceTurn({
      storeContext,
      userText,
      conversationHistory: conversationHistory || undefined,
    });

    if (!turnResult.success) {
      await prisma.voiceAction.create({
        data: {
          sessionId: session.id,
          storeId: store.id,
          type: mapActionNameToType("other"),
          status: VoiceActionStatus.FAILED,
          intentName: "invalid_model_output",
          parametersJson: null,
          resultJson: turnResult.raw ? JSON.stringify({ raw: turnResult.raw }) : null,
          errorMessage: turnResult.message ?? undefined,
        },
      });
      return c.json(
        {
          sessionId: session.id,
          transcript: userText,
          response: {
            type: "answer" as const,
            message:
              "No entendí bien. ¿Puedes repetirlo más directo? (Ej: “agrega 10 cocas”)",
          },
        },
        200,
      );
    }

    const modelOut = turnResult.output;

    if (modelOut.type === "answer") {
      await prisma.voiceAction.create({
        data: {
          sessionId: session.id,
          storeId: store.id,
          type: mapActionNameToType("other"),
          status: VoiceActionStatus.EXECUTED,
          intentName: "answer",
          parametersJson: null,
          resultJson: JSON.stringify(modelOut),
          executedAt: new Date(),
        },
      });
      return c.json(
        { sessionId: session.id, transcript: userText, response: modelOut },
        200,
      );
    }

    if (modelOut.type === "clarification") {
      await prisma.voiceAction.create({
        data: {
          sessionId: session.id,
          storeId: store.id,
          type: mapActionNameToType("other"),
          status: VoiceActionStatus.PENDING,
          intentName: "clarification",
          parametersJson: null,
          resultJson: JSON.stringify(modelOut),
        },
      });
      return c.json(
        { sessionId: session.id, transcript: userText, response: modelOut },
        200,
      );
    }

    const actionNameParsed = VoiceActionNameSchema.safeParse(modelOut.action);
    const actionName = actionNameParsed.success ? actionNameParsed.data : "other";

    const actionRow = await prisma.voiceAction.create({
      data: {
        sessionId: session.id,
        storeId: store.id,
        type: mapActionNameToType(actionName),
        status: VoiceActionStatus.PENDING,
        intentName: modelOut.action,
        parametersJson: modelOut.parameters
          ? JSON.stringify(modelOut.parameters)
          : null,
      },
    });

    const exec = await executeVoiceAction(store.id, modelOut);

    if (!exec.ok) {
      await prisma.voiceAction.update({
        where: { id: actionRow.id },
        data: {
          status: VoiceActionStatus.FAILED,
          errorMessage: exec.message,
          executedAt: new Date(),
        },
      });
      return c.json(
        {
          sessionId: session.id,
          transcript: userText,
          response: { type: "answer" as const, message: exec.message },
        },
        200,
      );
    }

    await prisma.voiceAction.update({
      where: { id: actionRow.id },
      data: {
        status: VoiceActionStatus.EXECUTED,
        resultJson: JSON.stringify(exec.data ?? { message: exec.message }),
        executedAt: new Date(),
      },
    });

    return c.json(
      {
        sessionId: session.id,
        transcript: userText,
        response: { type: "answer" as const, message: exec.message },
      },
      200,
    );
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
