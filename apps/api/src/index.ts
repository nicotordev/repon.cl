import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => c.json({ message: "API repon.cl", version: "0.0.0" }));

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 4000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
