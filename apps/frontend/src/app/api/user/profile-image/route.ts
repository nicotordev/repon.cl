import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Proxy POST /api/user/profile-image → backend /api/v1/user/profile-image
 * so the request is authenticated with the server's Clerk token (avoids 401 from client-side fetch).
 */
export async function POST(request: Request) {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Falta el archivo o no es válido" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }

    const filename = file instanceof File ? file.name : "image";
    const forwardData = new FormData();
    forwardData.append("file", file, filename);

    const res = await fetch(`${API_BASE}/api/v1/user/profile-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: forwardData,
    });

    let data: { imageUrl?: string; error?: string };
    try {
      data = (await res.json()) as { imageUrl?: string; error?: string };
    } catch {
      const text = await res.text().catch(() => "");
      data = { error: text || "Error al subir la foto" };
    }
    if (!res.ok) {
      const message =
        typeof data.error === "string" && data.error.trim()
          ? data.error.trim()
          : "Error al subir la foto";
      return NextResponse.json({ error: message }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[profile-image] Upload failed:", err);
    const message = err instanceof Error ? err.message : "Error al subir la foto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/user/profile-image - Remove profile image (proxy to backend).
 */
export async function DELETE() {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${API_BASE}/api/v1/user/profile-image`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok) {
      const message =
        typeof data.error === "string" && data.error.trim()
          ? data.error.trim()
          : "Error al eliminar la foto";
      return NextResponse.json({ error: message }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile-image] Delete failed:", err);
    const message = err instanceof Error ? err.message : "Error al eliminar la foto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
