import express from "express";
import fs from "fs";

export function makeStatsRouter({ filesStore, storagePath }) {
    const router = express.Router();

    router.get("/", async (_req, res) => {
        const files = filesStore.list();
        const totalBytes = files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);

        let diskFreeBytes = null;
        let diskTotalBytes = null;

        if (typeof fs.statfs === "function") {
            try {
                const info = await fs.promises.statfs(storagePath);
                diskTotalBytes = info.bsize * info.blocks;
                diskFreeBytes = info.bsize * info.bavail;
            } catch {

            }
        }

        res.json({
            fileCount: files.length,
            totalBytes,
            diskFreeBytes,
            diskTotalBytes,
        });
    });

    return router;
}