import express from "express";

export function makeFoldersRouter({ foldersStore, filesStore }) {
    const router = express.Router();

    router.get("/", (_req, res) => {
        res.json(foldersStore.list());
    });

    router.post("/", (req, res) => {
        const { name } = req.body || {};
        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: "Missing folder name" });
        }
        const item = foldersStore.add(name);
        res.json(item);
    });

    router.delete("/:id", (req, res) => {
        const removed = foldersStore.remove(req.params.id);
        if (!removed) return res.status(404).json({ error: "Not found" });

        //unassign files from the folder
        const all = filesStore.list();
        for (const f of all) {
            if (f.folderId === removed.id) {
                filesStore.update(f.id, { folderId: null });
            }
        }

        res.json({ ok: true });
    });

    return router;
}