import { FormEvent, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShieldCheck } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Modal de login local. Substitui a página `/login` separada — agora o
 * usuário clica em "Entrar" na landing e o dialog abre sobre a mesma
 * página, sem mudar de URL (mais próximo do que sites profissionais
 * fazem, mantendo o branding da ÓRBITA visível por trás).
 *
 * Escuta o evento `orbita:open-login` no window, que é disparado pelo
 * `startLogin()` (const.ts) e pelo `redirectToLoginIfUnauthorized`
 * (main.tsx) quando uma chamada tRPC volta UNAUTHORIZED.
 */
export default function LocalLoginDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const auth = useAuth();
  useEffect(() => {
    const onOpen = () => { setError(null); setRecoveryMessage(null); setOpen(true); };
    window.addEventListener("orbita:open-login", onOpen as EventListener);
    return () => window.removeEventListener("orbita:open-login", onOpen as EventListener);
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true); setError(null); setRecoveryMessage(null);
    try {
      const response = await fetch("/api/auth/local/login", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: String(form.get("email") || ""), password: String(form.get("password") || "") }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Não foi possível iniciar a sessão.");
      // Após o login, refaz a query `auth.me` para o app refletir a
      // nova sessão, fecha o dialog e leva o usuário direto para a
      // ÁGUIA (dashboard). Evita que ele tenha que clicar de novo
      // em "Abrir área de trabalho" depois de logar.
      await auth.refresh();
      setOpen(false);
      if (window.location.hash !== "#dashboard") {
        window.location.hash = "dashboard";
      }
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
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="institutional-login">
      <DialogHeader>
        <BrandMark />
        <DialogTitle>Entrar na área de trabalho</DialogTitle>
        <DialogDescription>Acesse com sua conta institucional para continuar seu trabalho.</DialogDescription>
      </DialogHeader>
      <form className="form-stack" onSubmit={submit}>
        <label className="field"><span>E-mail institucional</span><input type="email" name="email" required autoComplete="email" /></label>
        <label className="field"><span>Senha</span><input type="password" name="password" required autoComplete="current-password" /></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button button-ink button-block" disabled={pending} type="submit"><ShieldCheck size={15} /> {pending ? "Autenticando…" : "Entrar"}</button>
      </form>
      <details className="local-login-recovery">
        <summary>Esqueci minha senha</summary>
        <p>Solicite à Administração a redefinição da sua senha.</p>
        <form className="form-stack" onSubmit={requestRecovery}>
          <label className="field"><span>E-mail institucional</span><input type="email" name="recoveryEmail" required autoComplete="email" /></label>
          {recoveryMessage ? <p className="form-success" role="status">{recoveryMessage}</p> : null}
          <button className="button button-ghost button-block" disabled={recovering} type="submit">{recovering ? "Registrando…" : "Solicitar nova senha"}</button>
        </form>
      </details>
    </DialogContent>
  </Dialog>;
}

// Versão local do BrandMark para não importar do Home.tsx e criar ciclo.
function BrandMark() {
  const { theme } = useTheme();
  return <img className="institutional-login-logo" src={`/orbita/brand/svg/signature-horizontal${theme === "dark" ? "-negative" : ""}.svg`} alt="ÓRBITA — Plataforma Integrada de Contratações Públicas" />;
}
