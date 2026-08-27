/**
 * Hosted-OAuth routes (was: Manus OAuth).
 *
 * Standalone (self-hosted) deployments use AUTH_MODE=local, so this file is
 * never imported at runtime in that mode. The function below is kept only so
 * the conditional import in `server/_core/index.ts` doesn't fail at parse time
 * if someone sets AUTH_MODE to anything other than "local".
 *
 * If a hosted mode is reintroduced, restore the original `/api/oauth/callback`
 * handler here.
 */
import type { Express } from "express";

export function registerOAuthRoutes(_app: Express): void {
  throw new Error(
    "Hosted OAuth is not available in this build. Set AUTH_MODE=local or restore " +
      "the OAuth handler in server/_core/oauth.ts."
  );
}
