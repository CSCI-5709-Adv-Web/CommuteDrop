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
    allowedHosts: [
      "adae20237c7f0499ab8f25b18093eff2-02eabdebe2d7b8c1.elb.us-east-1.amazonaws.com",
      "*.elb.us-east-1.amazonaws.com",
      "all",
    ],
  },
});
