export const appName =
  process.env.NEXT_PUBLIC_APP_NAME ?? "Repon POS";
export const mockMode =
  process.env.NEXT_PUBLIC_MOCK_MODE === "true";
export const featureOffline =
  process.env.NEXT_PUBLIC_FEATURE_OFFLINE !== "false";
export const featureCopilot =
  process.env.NEXT_PUBLIC_FEATURE_COPILOT !== "false";
export const featureVoice =
  process.env.NEXT_PUBLIC_FEATURE_VOICE !== "false";
