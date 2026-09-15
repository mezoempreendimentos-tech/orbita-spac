import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

vi.mock("./localAuth", () => ({
  authenticateLocalRequest: vi.fn(async req =>
    req.headers.authorization === "test-session"
      ? { id: 1, active: true }
      : null
  ),
}));
import { registerLocalStorageRoutes } from "./localStorageRoutes";

describe("downloads locais exigem sessão", () => {
  let directory: string;
  let server: Server;
  let origin: string;
  const previousDirectory = process.env.LOCAL_STORAGE_DIR;
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "orbita-download-test-"));
    process.env.LOCAL_STORAGE_DIR = directory;
    await writeFile(join(directory, "documento.txt"), "arquivo de teste");
    const app = express();
    registerLocalStorageRoutes(app);
    server = await new Promise<Server>(resolve => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
    await unlink(join(directory, "documento.txt"));
    await rmdir(directory);
    if (previousDirectory === undefined) delete process.env.LOCAL_STORAGE_DIR;
    else process.env.LOCAL_STORAGE_DIR = previousDirectory;
  });
  it("bloqueia download sem sessão", async () => {
    expect((await fetch(`${origin}/files/documento.txt`)).status).toBe(401);
  });
  it("entrega arquivo interno autenticado com cache privado", async () => {
    const response = await fetch(`${origin}/files/documento.txt`, {
      headers: { authorization: "test-session" },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).toBe("arquivo de teste");
  });
  it("rejeita travessia e diretório", async () => {
    for (const key of ["..%2Ffora.txt", ""]) {
      expect(
        (
          await fetch(`${origin}/files/${key}`, {
            headers: { authorization: "test-session" },
          })
        ).status
      ).toBe(404);
    }
  });
});
