// Node build for cPanel/Passenger shared hosting. Same app, different Nitro
// target: no Cloudflare Workers plugin, and the Nitro preset swapped from the
// wrapper's cloudflare-module default to node-server (a self-contained Node
// HTTP server that listens on process.env.PORT, which is what cPanel's
// "Setup Node.js App" / Passenger expects).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
  },
});
