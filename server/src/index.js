import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { makeFilesRouter } from "./routes/files.js";
import { createFilesStore } from "./store/filesStore.js";
import { makeAuthRouter } from "./routes/auth.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { createFoldersStore } from "./store/foldersStore.js";
import { makeFoldersRouter } from "./routes/folders.js";
import { makeStatsRouter } from "./routes/stats.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
const dataDir = process.env.DATA_DIR || "./data";
const thumbsDir = process.env.THUMBS_DIR || "./thumbs";
const foldersStore = createFoldersStore(dataDir);

const store = createFilesStore(dataDir);

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Auth
app.use("/api/auth", makeAuthRouter());

// Protected file API
app.use(
  "/api/files",
  requireAuth,
  makeFilesRouter({ uploadDir, thumbsDir, store, foldersStore })
);

app.use("/api/folders", requireAuth, makeFoldersRouter({ foldersStore, filesStore: store }));

app.use("/api/stats", requireAuth, makeStatsRouter({ filesStore: store, storagePath: uploadDir }));

// Serve React build (single URL)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../../client/dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`✅ PiCloud running on http://0.0.0.0:${port}`);
});
