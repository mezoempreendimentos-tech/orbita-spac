import type { Express } from "express";
import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";

export function registerLocalStorageRoutes(app: Express) {
  app.get("/files/*", (req, res) => {
    const root = resolve(process.env.LOCAL_STORAGE_DIR || "./data/files");
    const relKey = decodeURIComponent(req.path.replace(/^\/files\//, "")).replace(/^\/+/, "");
    const file = resolve(root, relKey);
    if (!file.startsWith(`${root}/`) || !existsSync(file)) return res.sendStatus(404);
    createReadStream(file).pipe(res);
  });
}
