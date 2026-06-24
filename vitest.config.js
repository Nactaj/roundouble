// Config Vitest dédiée (distincte de vite.config.js pour ne pas charger le plugin PWA).
// Les tests portent sur du pur ESM (src/core, src/modes) — environnement Node, pas de DOM.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js"]
  }
});
