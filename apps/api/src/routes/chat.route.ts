import { Hono } from "hono";
import { handleVoice } from "../services/voice.handler.js";

const app = new Hono();

app.post("/voice", handleVoice);

export default app;
