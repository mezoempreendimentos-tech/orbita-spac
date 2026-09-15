import type { Express } from "express";
import { stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { authenticateLocalRequest } from "./localAuth";

export function registerLocalStorageRoutes(app: Express) {
  app.get("/files/*", async (req, res) => {
    try {
      if (!(await authenticateLocalRequest(req))) return res.sendStatus(401);
      const root = resolve(process.env.LOCAL_STORAGE_DIR || "./data/files");
      const relKey = decodeURIComponent(
        req.path.replace(/^\/files\//, "")
      ).replace(/^\/+/, "");
      const file = resolve(root, relKey);
      const rel = relative(root, file);
      if (!rel || isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`))
        return res.sendStatus(404);
      if (!(await stat(file)).isFile()) return res.sendStatus(404);
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.sendFile(file, error => {
        if (error && !res.headersSent) res.sendStatus(404);
      });
    } catch {
      if (!res.headersSent) res.sendStatus(404);
    }
  });
}
