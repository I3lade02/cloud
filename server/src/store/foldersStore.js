import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

export function createFoldersStore(dataDir) {
    const filePath = path.join(dataDir, "folders.json");

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
            return read().sort((a, b) => a.name.localeCompare(b.name));
        },

        add(name) {
            const data = read();
            const item = {
                id: uuid(),
                name: String(name || "").trim() || "New folder",
                createdAt: new Date().toISOString(),
            };
            data.push(item);
            write(data);
            return item;
        },

        remove(id) {
            const data = read();
            const idx = data.findIndex((f) => f.id === id);
            if (idx === -1) return null;
            const [removed] = data.splice(idx, 1);
            write(data);
            return removed;
        },

        exists(id) {
            return !!read().find((f) => f.id === id);
        },
    };
}