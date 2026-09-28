import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./shared/config/env.js";
import { AppError } from "./shared/errors/index.js";
import { membersRoutes } from "./modules/members/interface/routes.js";
import { tagsRoutes } from "./modules/tags/interface/routes.js";
import { discoveryRoutes } from "./modules/discovery/routes.js";
import { connectionsRoutes } from "./modules/connections/routes.js";
import { messagesRoutes } from "./modules/messages/routes.js";
import { uploadsRoutes } from "./modules/uploads/routes.js";
import { reviewsRoutes } from "./modules/reviews/routes.js";
import { savedRoutes } from "./modules/saved/routes.js";
import { notificationsRoutes } from "./modules/notifications/routes.js";
import { billingRoutes } from "./modules/billing/routes.js";

// Allowed web origins. In prod ALLOWED_ORIGINS is set to the real domains; locally
// it's unset, so we stay permissive (any origin) for dev convenience.
const ALLOWED = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function createApp() {
  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (ALLOWED.length === 0) return origin ?? "*"; // dev: echo any origin
        return ALLOWED.includes(origin) ? origin : ALLOWED[0]; // prod: only our domains
      },
      allowHeaders: ["content-type", "authorization", "x-dev-sub"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, service: "farmandtravel-backend" }));

  // Feature modülleri
  app.route("/", membersRoutes);
  app.route("/", tagsRoutes);
  app.route("/", discoveryRoutes);
  app.route("/", connectionsRoutes);
  app.route("/", messagesRoutes);
  app.route("/", uploadsRoutes);
  app.route("/", reviewsRoutes);
  app.route("/", savedRoutes);
  app.route("/", notificationsRoutes);
  app.route("/", billingRoutes);

  // Merkezî hata çevirici
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ error: err.code, message: err.message }, err.status as any);
    }
    if (err?.name === "ZodError") {
      return c.json({ error: "validation", details: (err as any).issues }, 400);
    }
    console.error(err);
    return c.json({ error: "internal", message: "Beklenmeyen hata" }, 500);
  });

  return app;
}
