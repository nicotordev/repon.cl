import {
  resolveStoreForUser,
  buildStoreContext,
  resolveUserByClerkId,
} from "./store.service.js";
import {
  findSessionForUser,
  createVoiceSession,
  loadConversationHistory,
  formatHistoryForPrompt,
} from "./session.service.js";

export type VoiceContextSuccess = {
  ok: true;
  store: {
    id: string;
    name: string;
    rut: string | null;
    timezone: string;
    currency: string;
  };
  session: { id: string };
  storeContext: string;
  conversationHistory: string;
};

export type VoiceContextNoStore = {
  ok: false;
  status: 200;
  payload: {
    transcript: "";
    response: { type: "clarification"; question: string };
  };
};

export type VoiceContextResult = VoiceContextSuccess | VoiceContextNoStore;

/**
 * Resolves store and session, builds store context and conversation history
 * for the voice pipeline. Use this before transcribing and calling the LLM.
 */
export async function getVoiceRequestContext(args: {
  clerkUserId: string;
  requestedStoreId: string | null;
  sessionId: string | null;
}): Promise<VoiceContextResult> {
  const { clerkUserId, requestedStoreId, sessionId } = args;

  // 1. Resolve user first to share across lookups
  const user = await resolveUserByClerkId(clerkUserId);
  if (!user) {
    return {
      ok: false,
      status: 200,
      payload: {
        transcript: "",
        response: {
          type: "clarification",
          question: "No pude identificar tu usuario. Por favor, reintenta.",
        },
      },
    };
  }

  // 2. Resolve store and session in parallel using the resolved user
  let [store, session] = await Promise.all([
    resolveStoreForUser(user, requestedStoreId),
    sessionId ? findSessionForUser(sessionId, user.id) : Promise.resolve(null),
  ]);

  if (session) {
    store = (session as any).store; // use store from session for consistency
  }

  if (!store) {
    return {
      ok: false,
      status: 200,
      payload: {
        transcript: "",
        response: {
          type: "clarification",
          question:
            "No tengo una tienda asociada. ¿Qué tienda quieres usar (storeId)?",
        },
      },
    };
  }

  const resolvedSessionId = session
    ? session.id
    : (await createVoiceSession(
        { id: store.id, timezone: store.timezone },
        user.id,
      )).id;

  // 3. Build context and load history in parallel
  const [storeContext, historyPairs] = await Promise.all([
    buildStoreContext({
      id: store.id,
      name: store.name,
      rut: store.rut,
      timezone: store.timezone,
      currency: store.currency,
    }),
    loadConversationHistory(resolvedSessionId),
  ]);

  const conversationHistory = formatHistoryForPrompt(historyPairs);

  return {
    ok: true,
    store: {
      id: store.id,
      name: store.name,
      rut: store.rut,
      timezone: store.timezone,
      currency: store.currency,
    },
    session: { id: resolvedSessionId },
    storeContext,
    conversationHistory,
  };
}
