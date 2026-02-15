import { Hono } from "hono";
import userService from "../services/user.service.js";
import { getAuth } from "@hono/clerk-auth";

const app = new Hono();

/**
 * GET / - Retrieves the authenticated user by Clerk ID.
 * Clerk ID is expected as the 'x-clerk-user-id' header.
 */
app.get("/", async (c) => {
  const session = await getAuth(c);
  if (!session || !session.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const user = await userService.getUserByClerkId(session.userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json(user);
});

export default app;
