/**
 * Hosted-storage proxy (was: Manus Storage Proxy -> /manus-storage/{key}).
 *
 * Standalone (self-hosted) deployments use STORAGE_DRIVER=local, so this
 * file is never imported at runtime in that mode. Kept only so the
 * conditional import in `server/_core/index.ts` doesn't fail at parse time
 * if someone sets STORAGE_DRIVER to anything other than "local".
 *
 * If a hosted mode is reintroduced, restore the original 307-redirect handler
 * here (it forwarded `/manus-storage/{key}` to a Forge-presigned S3 URL).
 */
import type { Express } from "express";

export function registerStorageProxy(_app: Express): void {
  throw new Error(
    "Hosted storage proxy is not available in this build. Set " +
      "STORAGE_DRIVER=local or restore the proxy in server/_core/storageProxy.ts."
  );
}
