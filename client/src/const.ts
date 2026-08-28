import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS };

/**
 * Abre o modal de login local sobre a página atual. Disparado pelo botão
 * "Entrar" da landing e pelo interceptador de erros tRPC (main.tsx) quando
 * uma chamada volta UNAUTHORIZED.
 *
 * Antes isso redirecionava para `/login` (página separada). Agora o
 * dialog abre sobre a landing, mantendo o branding da ÓRBITA visível e
 * dispensando a navegação. A URL permanece a mesma.
 *
 * O componente `LocalLoginDialog` (App.tsx) escuta o evento
 * `orbita:open-login` no window e controla a abertura.
 */
export const startLogin = () => {
  if (typeof window === "undefined") return;
  // Normaliza a URL (caso esteja em /login por deep-link antigo) para
  // que o dialog abra sobre a landing, e não sobre uma página morta.
  if (window.location.pathname === "/login") {
    window.history.replaceState(null, "", "/");
  }
  window.dispatchEvent(new CustomEvent("orbita:open-login"));
};
