import { Hono } from "hono";
import { getAuth } from "@hono/clerk-auth";
import prisma from "../lib/prisma.js";
import { resolveStoreForUser } from "../services/store.service.js";

const app = new Hono();

async function getStore(c: any) {
  const session = await getAuth(c);
  if (!session || !session.userId) return null;
  const storeId = c.req.header("x-store-id");
  return await resolveStoreForUser(session.userId, storeId || null);
}

/** GET /api/v1/alerts — list alerts for the current user's store (unread first) */
app.get("/", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const limit = Math.min(Number(c.req.query("limit")) || 30, 50);

  const alerts = await prisma.storeAlert.findMany({
    where: { storeId: store.id },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: limit,
  });

  return c.json(alerts);
});

/** PATCH /api/v1/alerts/:id/read — mark alert as read */
app.patch("/:id/read", async (c) => {
  const store = await getStore(c);
  if (!store) return c.json({ error: "Unauthorized or store not found" }, 401);

  const id = c.req.param("id");
  const updated = await prisma.storeAlert.updateMany({
    where: { id, storeId: store.id },
    data: { isRead: true, readAt: new Date() },
  });

  if (updated.count === 0) return c.json({ error: "Alert not found" }, 404);

  const alert = await prisma.storeAlert.findFirst({
    where: { id, storeId: store.id },
  });
  return c.json(alert);
});

export default app;
