import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// base must match the GitHub Pages project path: nactaj.github.io/roundouble/
// (pour un domaine personnalisé, repasser base à "/").
export default defineConfig({
  base: "/roundouble/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Roundouble — Tournois",
        short_name: "Roundouble",
        lang: "fr",
        description: "Gestionnaire de tournois de badminton (Mexicano et plus).",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "icons/maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg}"]
      }
    })
  ]
});
