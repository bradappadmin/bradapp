import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:5174",
        changeOrigin: true,
      },
      "/cars": {
        target: "http://127.0.0.1:5174",
        changeOrigin: true,
      },
      "/health": {
        target: "http://127.0.0.1:5174",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
  },
});
