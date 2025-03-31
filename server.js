const express = require("express");
const path = require("path");
const app = express();

// Serve static files from the dist directory with proper MIME types
app.use(
  express.static(path.join(__dirname, "dist"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path.endsWith(".mjs")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path.endsWith(".css")) {
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
const server = app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});

// Start the WebSocket server
require("./server/websocket-server.js");
