import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppError } from "./shared/errors/index.js";
import { membersRoutes } from "./modules/members/interface/routes.js";
import { tagsRoutes } from "./modules/tags/interface/routes.js";
import { discoveryRoutes } from "./modules/discovery/routes.js";
import { connectionsRoutes } from "./modules/connections/routes.js";

export function createApp() {
  const app = new Hono();
  app.use("*", cors());

  app.get("/health", (c) => c.json({ ok: true, service: "farmandtravel-backend" }));

  // Feature modülleri
  app.route("/", membersRoutes);
  app.route("/", tagsRoutes);
  app.route("/", discoveryRoutes);
  app.route("/", connectionsRoutes);

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
