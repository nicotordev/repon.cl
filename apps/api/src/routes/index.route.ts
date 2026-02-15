import { Hono } from "hono";
import miscRoute from "./misc.route.js";
import chatRoute from "./chat.route.js";
import userRoute from "./user.route.js";

const app = new Hono();

app.get("/", (c) => c.json({ message: "API repon.cl", version: "0.0.0" }));

app.route("/misc", miscRoute);
app.route("/chat", chatRoute);
app.route("/user", userRoute);

export default app;
