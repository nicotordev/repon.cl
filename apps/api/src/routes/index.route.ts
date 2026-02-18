import { Hono } from "hono";
import miscRoute from "./misc.route.js";
import chatRoute from "./chat.route.js";
import userRoute from "./user.route.js";
import inventoryRoute from "./inventory.route.js";
import alertsRoute from "./alerts.route.js";
import catalogRoute from "./catalog.route.js";
import internalRoute from "./internal.route.js";

const app = new Hono();

app.get("/", (c) => c.json({ message: "API repon.cl", version: "0.0.0" }));

app.route("/misc", miscRoute);
app.route("/chat", chatRoute);
app.route("/user", userRoute);
app.route("/inventory", inventoryRoute);
app.route("/alerts", alertsRoute);
app.route("/catalog", catalogRoute);
app.route("/internal", internalRoute);

export default app;
