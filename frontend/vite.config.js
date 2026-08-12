import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/images": "http://localhost:3000",
      "/people": "http://localhost:3000",
      "/Books": "http://localhost:3000",
      "/css": "http://localhost:3000",
      "/js": "http://localhost:3000",
      "/favicon.ico": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
  },
});
