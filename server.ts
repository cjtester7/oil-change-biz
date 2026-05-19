import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

/**
 * Version: v1 (Backend)
 * Changes: Initial server implementation to support full-stack architecture.
 * Provides API routes and serves the Vite frontend.
 */

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Mock endpoint for real-time bay status
  app.get("/api/bays", (req, res) => {
    res.json([
      { id: 1, name: "Bay 1", status: "occupied", timer: "12:45" },
      { id: 2, name: "Bay 2", status: "open", timer: null },
      { id: 3, name: "Bay 3", status: "warning", timer: "28:10" },
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
