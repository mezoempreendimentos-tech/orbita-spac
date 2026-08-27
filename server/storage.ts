/**
 * Storage helpers for the standalone (self-hosted) build.
 *
 * Uploads go to a local directory on the server's filesystem, served by the
 * Express static middleware at `/files/{key}`. No external storage backend.
 *
 * The original hosted build used Manus Forge (S3 + presigned URLs proxied
 * through /manus-storage/{key}); that path was removed in the Manus rip-out
 * (2026-08-27) along with _core/storageProxy.ts and the Forge env vars.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const root = resolve(process.env.LOCAL_STORAGE_DIR || "./data/files");
  const target = resolve(root, key);
  // Path-traversal guard: the resolved target must stay inside the storage root.
  if (!target.startsWith(`${root}/`) && target !== root) {
    throw new Error("Chave de arquivo inválida.");
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
  return { key, url: `/files/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/files/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  // Local build: the file is already publicly served at /files/{key} by the
  // Express static middleware. No signing required.
  const key = normalizeKey(relKey);
  const origin = (process.env.APP_ORIGIN ?? "").replace(/\/$/, "");
  return `${origin}/files/${key}`;
}
