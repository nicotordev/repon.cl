/**
 * Voice recording state machine.
 * Transitions: IDLE → RECORDING → PROCESSING → RESPONDING | ERROR → IDLE
 */
export type VoiceState =
  | "IDLE"
  | "RECORDING"
  | "PROCESSING"
  | "RESPONDING"
  | "ERROR";

/** Respuesta exitosa del POST /api/v1/chat/voice */
export interface VoiceApiSuccess {
  sessionId: string;
  transcript: string;
  response: { type: "answer"; message: string };
}

/** Body de error de la API de voz (400, 413, 415, 500) */
export interface VoiceApiErrorBody {
  error?: string;
  code?: string;
}

/** Lo que el hook expone al UI (= response.message) */
export interface VoiceResult {
  transcript: string;
  response: string;
}

export interface VoiceRecordingState {
  state: VoiceState;
  error: string | null;
  result: VoiceResult | null;
  /** Transcripción del usuario (llega en el primer evento del stream). */
  streamingTranscript: string | null;
  /** Texto que va llegando mientras se hace stream de la respuesta (antes de pasar a RESPONDING). */
  streamingResponse: string | null;
}
