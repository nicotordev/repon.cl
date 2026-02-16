import { Hono } from "hono";
import { handleVoice } from "../services/voice.handler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const app = new Hono();

app.post("/voice", requireAuth, handleVoice);

export default app;
