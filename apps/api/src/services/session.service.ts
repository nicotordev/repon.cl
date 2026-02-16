import prisma from "../lib/prisma.js";

const HISTORY_TURNS = 5;

function assistantMessageFromAction(action: {
  resultJson: string | null;
  errorMessage: string | null;
  intentName: string | null;
}): string {
  if (action.errorMessage) return action.errorMessage;
  if (!action.resultJson) return "(sin respuesta)";
  try {
    const o = JSON.parse(action.resultJson) as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.question === "string") return o.question;
    if (o.raw != null) return "(respuesta no interpretada)";
  } catch {
    // ignore
  }
  return "(respuesta guardada)";
}

/** Sesión de voz con store; solo existe si el usuario tiene acceso a esa tienda. */
export async function findSessionForUser(
  sessionId: string,
  userId: string,
) {
  const session = await prisma.voiceSession.findUnique({
    where: { id: sessionId },
    include: { store: true },
  });
  if (!session) return null;

  const member = await prisma.storeMember.findFirst({
    where: { storeId: session.storeId, userId },
  });
  if (!member) return null;

  return session;
}

export async function createVoiceSession(store: { id: string; timezone: string }, userId: string) {
  const locale = store.timezone?.startsWith("America/") ? "es-CL" : "es-CL";

  return prisma.voiceSession.create({
    data: {
      storeId: store.id,
      userId,
      locale,
      device: "web",
    },
  });
}

export async function loadConversationHistory(
  sessionId: string,
  limit: number = HISTORY_TURNS,
) {
  const [transcriptsAsc, actionsAsc] = await Promise.all([
    prisma.voiceTranscript.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.voiceAction.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { resultJson: true, errorMessage: true, intentName: true },
    }),
  ]);

  const transcripts = transcriptsAsc.reverse();
  const actions = actionsAsc.reverse();

  const pairs: { user: string; assistant: string }[] = [];
  const len = Math.min(transcripts.length, actions.length);
  for (let i = 0; i < len; i++) {
    const user = transcripts[i].inputText.trim();
    const assistant = assistantMessageFromAction(actions[i]);
    if (user.length > 0 || assistant.length > 0) {
      pairs.push({ user, assistant });
    }
  }
  return pairs;
}

export function formatHistoryForPrompt(
  pairs: { user: string; assistant: string }[],
): string {
  if (pairs.length === 0) return "";
  return pairs
    .map(
      (p) =>
        `Usuario: ${p.user || "(audio sin texto)"}\nAsistente: ${p.assistant}`,
    )
    .join("\n\n");
}
