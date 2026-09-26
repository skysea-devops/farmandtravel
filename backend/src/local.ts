// Lokal geliştirme sunucusu (node). Prod'da main.ts (Lambda) kullanılır.
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { env } from "./shared/config/env.js";

serve({ fetch: createApp().fetch, port: env.PORT }, (info) => {
  console.log(`farmandtravel-backend http://localhost:${info.port} (auth=${env.AUTH_MODE}, ai=${env.AI_MODE})`);
});
