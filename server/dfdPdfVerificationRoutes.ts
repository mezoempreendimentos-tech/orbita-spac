import type { Express } from "express";
import { verifyDfdPdfVerificationCode } from "./dfdPdfVerificationService";

export function registerDfdPdfVerificationRoutes(app: Express) {
  app.get("/api/public/dfd-verification", async (req, res) => {
    try {
      const code = typeof req.query.code === "string" ? req.query.code : "";
      const result = await verifyDfdPdfVerificationCode(code);
      res.status(result.valid ? 200 : 404).json(result);
    } catch {
      res.status(500).json({ valid: false, reason: "Não foi possível consultar a autenticidade no momento." });
    }
  });
}
