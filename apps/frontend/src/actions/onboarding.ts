"use server";

import backend, {
  BackendError,
  type OnboardingProfileInput,
} from "@/src/lib/backend";

export type OnboardingResult = { ok: true } | { ok: false; error: string };

export async function submitOnboarding(
  data: OnboardingProfileInput
): Promise<OnboardingResult> {
  try {
    await backend.updateUserProfile({
      ...data,
      completeOnboarding: true,
    });
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof BackendError ? e.message : "No se pudo guardar. Intenta de nuevo.";
    return { ok: false, error: message };
  }
}
