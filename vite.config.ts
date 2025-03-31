import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  define: {
    "process.env": {},
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // If you have API calls, you might want to proxy them
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
    // Disable host checking completely
    allowedHosts: "all",
  },
});
