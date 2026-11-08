import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { seoPages } from "./scripts/vite-seo.ts";
export default defineConfig({
  plugins: [react(), seoPages()],
  // Research HTML files are inputs to offline scripts, not application entries.
  optimizeDeps: { entries: ["index.html"] },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: { ignored: ["**/scripts/.source-cache/**"] },
  },
});
