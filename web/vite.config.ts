import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { ProxyOptions } from "vite";
import { defineConfig } from "vitest/config";

const apiTarget = "http://127.0.0.1:5174";

/** HTML navigations stay on the SPA; XHR/fetch still hit the API. */
const spaBypass: NonNullable<ProxyOptions["bypass"]> = (req) => {
  const accept = req.headers.accept ?? "";
  if (accept.includes("text/html")) {
    return "/index.html";
  }
};

function apiProxy(): ProxyOptions {
  return {
    target: apiTarget,
    changeOrigin: true,
    bypass: spaBypass,
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    // Allow Cloudflare / localtunnel / localhost.run public hostnames
    allowedHosts: true,
    proxy: {
      "/auth": apiProxy(),
      "/cars": apiProxy(),
      "/favourites": apiProxy(),
      "/members": apiProxy(),
      "/leaderboard": apiProxy(),
      "/activity": apiProxy(),
      "/trade": apiProxy(),
      "/play": apiProxy(),
      "/reviews": apiProxy(),
      "/admin": apiProxy(),
      "/health": {
        target: apiTarget,
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
