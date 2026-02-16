import { Hono } from "hono";
import userService from "../services/user.service.js";
import { resolveStoreForUser } from "../services/store.service.js";
import { getAuth } from "@hono/clerk-auth";
import prisma from "../lib/prisma.js";

const app = new Hono();

/** Body for PATCH / - update profile and/or complete onboarding */
const updateBodySchema = {
  name: (v: unknown) => (v === undefined || v === null ? undefined : String(v)),
  phone: (v: unknown) => (v === undefined || v === null ? undefined : String(v)),
  birthDate: (v: unknown) =>
    v === undefined || v === null ? undefined : new Date(String(v)),
  locale: (v: unknown) => (v === undefined || v === null ? undefined : String(v)),
  avatarUrl: (v: unknown) => (v === undefined || v === null ? undefined : String(v)),
  completeOnboarding: (v: unknown) => (v === true ? true : undefined),
  preferences: (v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined,
  store: (v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v) && (v as Record<string, unknown>).name != null
      ? (v as { name: string; rut?: string; address?: string; timezone?: string; currency?: string })
      : undefined,
} as const;

/**
 * GET / - Retrieves the authenticated user by Clerk ID.
 */
app.get("/", async (c) => {
  const session = await getAuth(c);
  if (!session || !session.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const user = await userService.getOrCreateUserByClerkId(session.userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json(user);
});

/**
 * PATCH / - Update user profile, preferences, and/or complete onboarding.
 */
app.patch("/", async (c) => {
  const session = await getAuth(c);
  if (!session || !session.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const user = await userService.getOrCreateUserByClerkId(session.userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = updateBodySchema.name(body.name);
  const phone = updateBodySchema.phone(body.phone);
  const birthDate = updateBodySchema.birthDate(body.birthDate);
  const locale = updateBodySchema.locale(body.locale);
  const avatarUrl = updateBodySchema.avatarUrl(body.avatarUrl);
  const completeOnboarding = updateBodySchema.completeOnboarding(body.completeOnboarding);
  const preferencesPayload = updateBodySchema.preferences(body.preferences);
  const storePayload = updateBodySchema.store(body.store);

  const userData: Record<string, unknown> = {};
  if (name !== undefined) userData.name = name;
  if (phone !== undefined) userData.phone = phone;
  if (birthDate !== undefined) userData.birthDate = birthDate;
  if (locale !== undefined) userData.locale = locale;
  if (avatarUrl !== undefined) userData.avatarUrl = avatarUrl;
  if (completeOnboarding === true) userData.onboardingCompleted = new Date();

  const updatedUser = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: user.id },
      data: userData,
    });
    if (preferencesPayload && typeof preferencesPayload === "object") {
      const notif = preferencesPayload.notificationsEnabled;
      const theme = preferencesPayload.theme;
      const language = preferencesPayload.language;
      await tx.userPreferences.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...(notif !== undefined && { notificationsEnabled: Boolean(notif) }),
          ...(typeof theme === "string" && { theme }),
          ...(typeof language === "string" && { language }),
        },
        update: {
          ...(notif !== undefined && { notificationsEnabled: Boolean(notif) }),
          ...(typeof theme === "string" && { theme }),
          ...(typeof language === "string" && { language }),
        },
      });
    }
    return u;
  });

  if (storePayload?.name != null && storePayload.name.trim() !== "") {
    const store = await resolveStoreForUser(session.userId, null);
    if (store) {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          name: storePayload.name.trim(),
          ...(storePayload.rut !== undefined && { rut: storePayload.rut?.trim() || null }),
          ...(storePayload.address !== undefined && { address: storePayload.address?.trim() || null }),
          ...(storePayload.timezone !== undefined && storePayload.timezone?.trim() && { timezone: storePayload.timezone.trim() }),
          ...(storePayload.currency !== undefined && storePayload.currency?.trim() && { currency: storePayload.currency.trim() }),
        },
      });
    }
  }

  return c.json(updatedUser);
});

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function inferImageType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

/**
 * POST /profile-image - Upload profile image (multipart), update in Clerk and DB.
 */
app.post("/profile-image", async (c) => {
  const session = await getAuth(c);
  if (!session || !session.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  let body: Record<string, unknown>;
  try {
    body = (await c.req.parseBody()) as Record<string, unknown>;
  } catch (e) {
    console.error("[user.route] parseBody failed:", e);
    return c.json({ error: "Invalid multipart body" }, 400);
  }
  const file = body["file"];
  if (!file || typeof file === "string") {
    return c.json({ error: "Missing or invalid file field" }, 400);
  }
  const raw = file as Blob & { type?: string; name?: string };
  const size = raw.size ?? (raw as unknown as { length?: number }).length;
  if (!size || size === 0) {
    return c.json({ error: "El archivo está vacío" }, 400);
  }
  let type = (raw.type ?? "").trim();
  const name = typeof (raw as unknown as { name?: string }).name === "string" ? (raw as unknown as { name: string }).name : "image";
  if (!type) type = inferImageType(name);
  if (!ACCEPTED_IMAGE_TYPES.includes(type)) {
    return c.json({ error: "Formato no válido. Usa JPEG, PNG, WebP o GIF." }, 400);
  }
  let imageFile: Blob | File = raw;
  if (typeof (raw as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    const buf = await (raw as Blob).arrayBuffer();
    imageFile = new File([buf], name, { type });
  }
  try {
    const imageUrl = await userService.updateProfileImage(session.userId, imageFile);
    return c.json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar la foto";
    console.error("[user.route] Profile image upload failed:", err);
    return c.json({ error: message }, 500);
  }
});

/**
 * DELETE /profile-image - Remove profile image in Clerk and DB.
 */
app.delete("/profile-image", async (c) => {
  const session = await getAuth(c);
  if (!session || !session.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    await userService.deleteProfileImage(session.userId);
    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo eliminar la foto";
    console.error("[user.route] Profile image delete failed:", err);
    return c.json({ error: message }, 500);
  }
});

export default app;
