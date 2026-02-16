import { Context, Next } from "hono";
import { getAuth } from "@hono/clerk-auth";

export async function requireAuth(c: Context, next: Next) {
  const auth = await getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
}
