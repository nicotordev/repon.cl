import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import backend, { BackendError } from "@/src/lib/backend";

/**
 * POST /api/onboarding/complete - Completa onboarding (evita Server Action / Turbopack).
 */
export async function POST(request: Request) {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await backend.updateUserProfile({
      ...body,
      completeOnboarding: true,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message =
      e instanceof BackendError ? e.message : "No se pudo guardar. Intenta de nuevo.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
