import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { generateVideoThumbnail } from "../utils/videoThumb.js";

export function makeFilesRouter({ uploadDir, thumbsDir, store, foldersStore }) {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(thumbsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}_${safe}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
  });

  const router = express.Router();

  // List
  router.get("/", (_req, res) => {
    res.json(store.list());
  });

  // Upload MULTIPLE files (field name: "files")
  // Optional: folderId in req.body
  router.post("/upload", upload.array("files", 20), async (req, res) => {
    const files = req.files || [];
    if (!files.length)
      return res.status(400).json({ error: "No files uploaded" });

    const folderId = req.body?.folderId || null;

    // Validate folderId if provided
    if (folderId && foldersStore && !foldersStore.exists(folderId)) {
      return res.status(400).json({ error: "Invalid folderId" });
    }

    const created = [];

    for (const f of files) {
      const isVideo = (f.mimetype || "").startsWith("video/");

      const item = store.add({
        originalName: f.originalname,
        storedName: f.filename,
        size: f.size,
        mime: f.mimetype,
        filePathOnDisk: f.path,
        isVideo,
        thumbPath: null,
        folderId,
      });

      created.push(item);

      // Thumbnail generation for videos (failure shouldn't break upload)
      if (isVideo) {
        try {
          const thumbAbs = await generateVideoThumbnail({
            videoPath: item.path,
            thumbsDir,
            fileId: item.id,
          });

          store.update(item.id, { thumbPath: thumbAbs });
        } catch {
          // ignore thumbnail errors
        }
      }
    }

    res.json(created);
  });

  // Assign / move a file to a folder (or to root with null)
  router.patch("/:id", (req, res) => {
    const file = store.get(req.params.id);
    if (!file) return res.status(404).json({ error: "Not found" });

    const { folderId } = req.body || {};
    const nextFolderId = folderId ?? null;

    if (nextFolderId && foldersStore && !foldersStore.exists(nextFolderId)) {
      return res.status(400).json({ error: "Invalid folderId" });
    }

    const updated = store.update(file.id, { folderId: nextFolderId });
    res.json(updated);
  });

  // Thumbnail (video)
  router.get("/:id/thumb", (req, res) => {
    const file = store.get(req.params.id);
    if (!file) return res.status(404).json({ error: "Not found" });
    if (!file.thumbPath)
      return res.status(404).json({ error: "No thumbnail" });

    const abs = path.resolve(file.thumbPath);
    if (!fs.existsSync(abs))
      return res.status(410).json({ error: "Thumb missing" });

    res.sendFile(abs);
  });

  // Raw (great for images)
  router.get("/:id/raw", (req, res) => {
    const file = store.get(req.params.id);
    if (!file) return res.status(404).json({ error: "Not found" });

    const abs = path.resolve(file.path);
    if (!fs.existsSync(abs))
      return res.status(410).json({ error: "File missing on disk" });

    res.setHeader("Content-Type", file.mime || "application/octet-stream");
    fs.createReadStream(abs).pipe(res);
  });

  // Stream (video OR audio) with Range support
  router.get("/:id/stream", (req, res) => {
    const file = store.get(req.params.id);
    if (!file) return res.status(404).json({ error: "Not found" });

    const abs = path.resolve(file.path);
    if (!fs.existsSync(abs))
      return res.status(410).json({ error: "File missing on disk" });

    const stat = fs.statSync(abs);
    const fileSize = stat.size;
    const range = req.headers.range;

    // No range => send whole file
    if (!range) {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": file.mime || "application/octet-stream",
      });
      fs.createReadStream(abs).pipe(res);
      return;
    }

    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) return res.status(416).end();

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || end < start) {
      res.writeHead(416, { "Content-Range": `bytes */${fileSize}` });
      return res.end();
    }

    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": file.mime || "application/octet-stream",
    });

    fs.createReadStream(abs, { start, end }).pipe(res);
  });

  // Download
  router.get("/:id/download", (req, res) => {
    const file = store.get(req.params.id);
    if (!file) return res.status(404).json({ error: "Not found" });

    const abs = path.resolve(file.path);
    if (!fs.existsSync(abs))
      return res.status(410).json({ error: "File missing on disk" });

    res.download(abs, file.originalName);
  });

  // Delete (also remove thumbnail if present)
  router.delete("/:id", (req, res) => {
    const file = store.remove(req.params.id);
    if (!file) return res.status(404).json({ error: "Not found" });

    try {
      const abs = path.resolve(file.path);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {}

    try {
      if (file.thumbPath) {
        const thumbAbs = path.resolve(file.thumbPath);
        if (fs.existsSync(thumbAbs)) fs.unlinkSync(thumbAbs);
      }
    } catch {}

    res.json({ ok: true });
  });

  return router;
}
