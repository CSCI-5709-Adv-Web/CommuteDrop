import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "./server/websocket-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the dist directory with proper MIME types
app.use(
  express.static(path.join(__dirname, "dist"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith(".mjs")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);

// Health check endpoint for Kubernetes
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Serve index.html for all other routes (for SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start the HTTP server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
