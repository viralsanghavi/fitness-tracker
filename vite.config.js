import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {VitePWA} from "vite-plugin-pwa";

const enablePWA = process.env.VITE_ENABLE_PWA === "true";

export default defineConfig({
  plugins: [
    react(),
    enablePWA
      ? VitePWA({
          registerType: "autoUpdate",
          includeAssets: ["icons/app-icon.svg"],
          manifest: {
            name: "Health & Lifestyle Tracker",
            short_name: "Lifestyle",
            description:
              "Track your holistic wellbeing, habits, and wins with delightful insights.",
            start_url: "/",
            display: "standalone",
            background_color: "#0f172a",
            theme_color: "#4461F2",
            icons: [
              {
                src: "/icons/app-icon.svg",
                sizes: "192x192",
                type: "image/svg+xml",
                purpose: "any",
              },
              {
                src: "/icons/app-icon.svg",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "any",
              },
            ],
            shortcuts: [
              {
                name: "Track Today",
                short_name: "Track",
                url: "/track",
                description: "Log today’s habits and reflections.",
              },
              {
                name: "View Analytics",
                short_name: "Analytics",
                url: "/analytics",
                description: "Check your health trends and mini calendar.",
              },
              {
                name: "Meal Journal",
                short_name: "Meals",
                url: "/meals",
                description: "Review meals logged across the week.",
              },
            ],
          },
          workbox: {skipWaiting: true, clientsClaim: true},
        })
      : null,
  ].filter(Boolean),
  server: {
    port: 5174,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("chart.js")) {
              return "vendor-chartjs";
            }
            if (id.includes("firebase")) {
              return "vendor-firebase";
            }
            return "vendor";
          }
        },
      },
    },
  },
  resolve: {
    alias: enablePWA
      ? {}
      : {
          "virtual:pwa-register": "/src/lib/emptyPwaRegister.js",
        },
  },
});
