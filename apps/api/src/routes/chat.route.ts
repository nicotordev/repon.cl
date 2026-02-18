import { Hono } from "hono";
import { requireAuth } from "../middleware/requireAuth.js";
import { handleTts } from "../services/tts.handler.js";
import { handleVoice } from "../services/voice.handler.js";

const app = new Hono();

app.post("/voice", requireAuth, handleVoice);
app.post("/tts", requireAuth, handleTts);

export default app;
