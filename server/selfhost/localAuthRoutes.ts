import type { Express } from "express";
import { getSessionCookieOptions } from "../_core/cookies";
import { authenticateLocalCredentials, createLocalSession, LOCAL_SESSION_COOKIE } from "./localAuth";
import { requestLocalPasswordRecovery } from "./localAccountService";

export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/auth/local/password-recovery", async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email : "";
      const result = await requestLocalPasswordRecovery(email);
      res.json(result);
    } catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : "Não foi possível registrar a solicitação." }); }
  });
  app.post("/api/auth/local/login", async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!email || !password) return res.status(400).json({ message: "Informe e-mail e senha." });
      const user = await authenticateLocalCredentials(email, password);
      const token = await createLocalSession(user);
      res.cookie(LOCAL_SESSION_COOKIE, token, { ...getSessionCookieOptions(req), sameSite: "lax", maxAge: 12 * 60 * 60 * 1000 });
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) { res.status(401).json({ message: error instanceof Error ? error.message : "Não foi possível iniciar a sessão." }); }
  });
}
