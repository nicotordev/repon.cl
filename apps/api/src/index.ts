import { Hono } from "hono";
import { clerkMiddleware } from "@hono/clerk-auth";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import indexRoute from "./routes/index.route.js";

const app = new Hono();

// Inyecta la sesión de Clerk en el contexto
app.use("*", clerkMiddleware());

app.use("*", cors());

app.route("/api/v1", indexRoute);

const port = Number(process.env.PORT) || 4000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
