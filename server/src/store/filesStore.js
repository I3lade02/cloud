import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

export function createFilesStore(dataDir) {
  const filePath = path.join(dataDir, "files.json");

  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }

  function read() {
    try {
      const raw = fs.readFileSync(filePath, "utf-8").trim();
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
  }

  function write(data) {
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, filePath);
  }

  return {
    list() {
      return read().sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    },

    add({ originalName, storedName, size, mime, filePathOnDisk, thumbPath = null, isVideo = false, folderId = null }) {
      const data = read();

      const item = {
        id: uuid(),
        originalName,
        storedName,
        size,
        mime,
        path: filePathOnDisk,
        thumbPath,
        isVideo,
        folderId,
        createdAt: new Date().toISOString(),
      };

      data.push(item);
      write(data);
      return item;
    },

    get(id) {
      return read().find((f) => f.id === id);
    },

    remove(id) {
      const data = read();
      const idx = data.findIndex((f) => f.id === id);
      if (idx === -1) return null;

      const [removed] = data.splice(idx, 1);
      write(data);
      return removed;
    },
    
    update(id, patch) {
        const data = read();
        const idx = data.findIndex((f) => f.id === id);
        if (idx === -1) return null;
        data[idx] = { ...data[idx], ...patch };
        write(data);
        return data[idx];
    }
  };

}
