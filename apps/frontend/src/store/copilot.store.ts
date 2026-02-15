"use client";

import { create } from "zustand";

export type CopilotMode = "mini" | "expanded";

export type SuggestedAction = {
  id: string;
  label: string;
  intent: string;
  payload?: unknown;
};

type CopilotState = {
  mode: CopilotMode;
  transcript: string;
  intent: string | null;
  suggestions: SuggestedAction[];
  isListening: boolean;
  setMode: (mode: CopilotMode) => void;
  setTranscript: (t: string) => void;
  setIntent: (intent: string | null) => void;
  setSuggestions: (s: SuggestedAction[]) => void;
  setListening: (v: boolean) => void;
  reset: () => void;
};

const initialState = {
  transcript: "",
  intent: null as string | null,
  suggestions: [] as SuggestedAction[],
  isListening: false,
};

export const useCopilotStore = create<CopilotState>((set) => ({
  mode: "mini",
  ...initialState,

  setMode: (mode) => set({ mode }),

  setTranscript: (transcript) => set({ transcript }),

  setIntent: (intent) => set({ intent }),

  setSuggestions: (suggestions) => set({ suggestions }),

  setListening: (isListening) => set({ isListening }),

  reset: () => set(initialState),
}));
