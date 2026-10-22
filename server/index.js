import { isProduction, PORT } from "./config.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import geminiRoutes from "./routes/gemini.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.use("/api/auth", authRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api", dataRoutes);

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

// In production the same server also serves the built React app.
if (isProduction) {
  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    console.warn("[web] dist/ not found. Run `npm run build` before `npm start`.");
  }
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  if (error?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON in request." });
  if (error?.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  console.error("[server]", error);
  res.status(500).json({ error: "Something went wrong on the server." });
});

try {
  await connectDB();
} catch (error) {
  console.error(`\n[db] Could not connect to MongoDB: ${error.message}`);
  console.error("[db] Check MONGODB_URL and MONGODB_PASSWORD in your .env file, and that your IP is allowed in Atlas Network Access.\n");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`[server] PrepMate API running on http://localhost:${PORT}${isProduction ? " (serving built app)" : ""}`);
});
