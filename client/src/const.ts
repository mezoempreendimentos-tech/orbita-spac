import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS };

/**
 * Start the local-account login flow. Navigates to /login, which renders the
 * institutional login form. The server is responsible for issuing the session
 * cookie via the local auth routes.
 *
 * Hosted-OAuth (the original Manus path) was removed in the Manus rip-out
 * (2026-08-27); the runtime no longer carries the VITE_OAUTH_PORTAL_URL /
 * VITE_APP_ID env vars. Reintroduce the second branch if a hosted mode is
 * ever restored.
 */
export const startLogin = () => {
  window.location.href = "/login";
};
