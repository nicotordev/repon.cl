import {
  resolveStoreForUser,
  buildStoreContext,
} from "./store.service.js";
import {
  findSessionForUser,
  createVoiceSession,
  loadConversationHistory,
  formatHistoryForPrompt,
} from "./session.service.js";

export type VoiceContextSuccess = {
  ok: true;
  store: NonNullable<Awaited<ReturnType<typeof resolveStoreForUser>>>;
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

  // 1. Resolve store and session in parallel where possible
  // resolveStoreForUser already handles user resolution and store membership
  let [store, session] = await Promise.all([
    resolveStoreForUser(clerkUserId, requestedStoreId),
    sessionId ? findSessionForUser(sessionId, clerkUserId) : Promise.resolve(null),
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

  if (!session) {
    session = await createVoiceSession(store.id, clerkUserId);
  }

  // 2. Build context and load history in parallel
  const [storeContext, historyPairs] = await Promise.all([
    buildStoreContext({
      id: store.id,
      name: store.name,
      rut: store.rut,
      timezone: store.timezone,
      currency: store.currency,
    }),
    loadConversationHistory(session.id),
  ]);

  const conversationHistory = formatHistoryForPrompt(historyPairs);

  return {
    ok: true,
    store,
    session,
    storeContext,
    conversationHistory,
  };
}
