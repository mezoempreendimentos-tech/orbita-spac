import { FormEvent, useState } from "react";

export default function LocalLogin() {
  const [error, setError] = useState<string | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true); setError(null); setRecoveryMessage(null);
    try {
      const response = await fetch("/api/auth/local/login", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: String(form.get("email") || ""), password: String(form.get("password") || "") }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Não foi possível iniciar a sessão.");
      window.location.assign("/");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível iniciar a sessão."); }
    finally { setPending(false); }
  };
  const requestRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("recoveryEmail") || "");
    setRecovering(true); setError(null); setRecoveryMessage(null);
    try {
      const response = await fetch("/api/auth/local/password-recovery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Não foi possível registrar a solicitação.");
      setRecoveryMessage(body.message || "Solicitação registrada. Procure a Administração.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível registrar a solicitação."); }
    finally { setRecovering(false); }
  };
  return <main className="local-login-shell"><section className="local-login-card"><span className="panel-kicker">SISTEMA ÓRBITA · ACESSO INSTITUCIONAL</span><h1>Entrar na área de trabalho</h1><p>Use a conta definida pela administração da instalação local.</p><form className="form-stack" onSubmit={submit}><label>E-mail institucional<input type="email" name="email" required autoComplete="email" /></label><label>Senha<input type="password" name="password" required autoComplete="current-password" /></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="button button-ink" disabled={pending} type="submit">{pending ? "Autenticando…" : "Entrar"}</button></form><details className="local-login-recovery"><summary>Esqueci minha senha</summary><p>Sem serviço de e-mail nesta versão inicial, a solicitação será encaminhada à Administração para redefinição manual da senha.</p><form className="form-stack" onSubmit={requestRecovery}><label>E-mail institucional<input type="email" name="recoveryEmail" required autoComplete="email" /></label>{recoveryMessage ? <p className="form-success" role="status">{recoveryMessage}</p> : null}<button className="button button-ghost" disabled={recovering} type="submit">{recovering ? "Registrando…" : "Solicitar nova senha"}</button></form></details></section></main>;
}
