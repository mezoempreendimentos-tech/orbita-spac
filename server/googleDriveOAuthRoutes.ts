import type { Express } from "express";
import { completeGoogleDriveAuthorization } from "./googleDriveService";

export function registerGoogleDriveOAuthRoutes(app: Express) {
  app.get("/api/integrations/google-drive/callback", async (req, res) => {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const error = typeof req.query.error === "string" ? req.query.error : undefined;
    try {
      await completeGoogleDriveAuthorization({ state, code, error });
      res.redirect("/?googleDrive=connected#oficina");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Não foi possível conectar a conta Google.";
      res.redirect(`/?googleDrive=error&message=${encodeURIComponent(message)}#oficina`);
    }
  });
}
