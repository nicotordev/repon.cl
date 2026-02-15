import { Hono } from "hono";
import chatService from "../services/chat.service.js";

const app = new Hono();

app.post("/voice", chatService.voice);

export default app;
