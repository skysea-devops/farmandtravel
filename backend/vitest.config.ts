import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgres://ft:ft@localhost:5432/farmandtravel",
      AUTH_MODE: "dev",
      AI_MODE: "stub",
    },
  },
});
