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

export interface VoiceResult {
  transcript: string;
  response: string;
}

export interface VoiceRecordingState {
  state: VoiceState;
  error: string | null;
  result: VoiceResult | null;
}
