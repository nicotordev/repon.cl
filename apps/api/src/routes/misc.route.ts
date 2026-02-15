import { Hono } from "hono";
import miscService from "../services/misc.service.js";

const app = new Hono();

app.get("/health", async (c) => c.json(await miscService.getHealth()));

export default app;
