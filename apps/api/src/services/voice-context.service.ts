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

  // Resolve store first (from existing session or by user membership)
  let store: Awaited<ReturnType<typeof resolveStoreForUser>> =
    await resolveStoreForUser(clerkUserId, requestedStoreId);

  let session: { id: string } | null = null;
  if (sessionId) {
    const existing = await findSessionForUser(sessionId, clerkUserId);
    if (existing) {
      session = existing;
      store = existing.store; // use store from session so context matches
    }
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

  const storeContext = buildStoreContext({
    id: store.id,
    name: store.name,
    rut: store.rut,
    timezone: store.timezone,
    currency: store.currency,
  });

  const historyPairs = await loadConversationHistory(session.id);
  const conversationHistory = formatHistoryForPrompt(historyPairs);

  return {
    ok: true,
    store,
    session,
    storeContext,
    conversationHistory,
  };
}
