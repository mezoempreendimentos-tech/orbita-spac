import type { Express } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSessionCookieOptions } from "../_core/cookies";
import {
  authenticateLocalCredentials,
  authenticateLocalRequest,
  createLocalSession,
  LOCAL_SESSION_COOKIE,
} from "./localAuth";
import { requestLocalPasswordRecovery } from "./localAccountService";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

const updateMyProfileSchema = z.object({
  name: z.string().trim().min(3, "Informe um nome com ao menos 3 caracteres.").max(255),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(320),
});

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
      res.cookie(LOCAL_SESSION_COOKIE, token, { ...getSessionCookieOptions(req), maxAge: 12 * 60 * 60 * 1000 });
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) { res.status(401).json({ message: error instanceof Error ? error.message : "Não foi possível iniciar a sessão." }); }
  });
  // Atualiza nome e e-mail do próprio usuário logado. Útil quando o admin
  // criou a conta com um e-mail provisório ou quando o usuário quer corrigir
  // o cadastro. O role e o estado (ativo/inativo) continuam sendo
  // gerenciados pela Administração em "Contas locais".
  app.patch("/api/auth/local/me", async (req, res) => {
    try {
      const user = await authenticateLocalRequest(req);
      if (!user) return res.status(401).json({ message: "Sessão expirada. Entre novamente para atualizar o cadastro." });
      const parsed = updateMyProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
          zodError: { issues: parsed.error.issues },
        });
      }
      const db = await getDb();
      if (!db) return res.status(503).json({ message: "Banco de dados indisponível." });
      const [emailTaken] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
      if (emailTaken && emailTaken.id !== user.id) {
        return res.status(409).json({ message: "Já existe uma conta cadastrada para este e-mail." });
      }
      await db.update(users).set({
        name: parsed.data.name,
        email: parsed.data.email,
        openId: `local:${parsed.data.email}`,
      }).where(eq(users.id, user.id));
      const [updated] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível atualizar o cadastro.";
      res.status(500).json({ message });
    }
  });
}
