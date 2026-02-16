import "dotenv/config";
import { Hono } from "hono";
import { clerkMiddleware } from "@hono/clerk-auth";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import indexRoute from "./routes/index.route.js";

const app = new Hono();

// CORS: con credentials (cookies) no puede usarse '*'; hay que indicar el origen exacto.
const corsOrigin = process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? "http://localhost:3000";
app.use(
  "*",
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);

// Inyecta la sesión de Clerk en el contexto
app.use("*", clerkMiddleware());

app.route("/api/v1", indexRoute);

const port = Number(process.env.PORT) || 4000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
