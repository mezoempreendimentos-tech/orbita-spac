import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { runPlanningDeadlineScheduler } from "../planningDeadlineScheduler";
import { registerGoogleDriveOAuthRoutes } from "../googleDriveOAuthRoutes";
import { registerDfdPdfVerificationRoutes } from "../dfdPdfVerificationRoutes";
import { registerLocalAuthRoutes } from "../selfhost/localAuthRoutes";
import { registerLocalStorageRoutes } from "../selfhost/localStorageRoutes";
import { registerLocalBackupRoutes } from "../selfhost/localBackupRoutes";
import { registerHealthRoute } from "./health";
import { registerMetaRoute } from "./meta";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  if (process.env.STORAGE_DRIVER !== "local") {
    const { registerStorageProxy } = await import("./storageProxy");
    registerStorageProxy(app);
  } else registerLocalStorageRoutes(app);
  if (process.env.AUTH_MODE !== "local") {
    const { registerOAuthRoutes } = await import("./oauth");
    registerOAuthRoutes(app);
  } else registerLocalAuthRoutes(app);
  if (process.env.AUTH_MODE === "local") registerLocalBackupRoutes(app);
  registerGoogleDriveOAuthRoutes(app);
  registerDfdPdfVerificationRoutes(app);
  registerHealthRoute(app);
  registerMetaRoute(app);
  app.post("/api/scheduled/planning-deadlines", runPlanningDeadlineScheduler);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Graceful shutdown: stop accepting new connections, drain in-flight requests,
  // then exit. Important for `docker compose down` / SIGTERM from a process
  // manager / CI timeout. Without this, in-flight DB writes can be cut off and
  // the MariaDB container can hit "wait_timeout" while we're still talking.
  const shutdown = (signal: NodeJS.Signals) => {
    console.log(`[orbita] received ${signal}, draining for up to 15s...`);
    const timer = setTimeout(() => {
      console.error("[orbita] forced exit after 15s drain timeout");
      process.exit(1);
    }, 15_000);
    timer.unref();
    server.close((err) => {
      if (err) {
        console.error("[orbita] error during shutdown:", err);
        process.exit(1);
      }
      console.log("[orbita] clean shutdown");
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // Surface unhandled errors loudly so they show up in `docker logs` instead of
  // being silently swallowed by a stale event loop.
  process.on("unhandledRejection", (reason) => {
    console.error("[orbita] unhandledRejection:", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("[orbita] uncaughtException:", err);
    process.exit(1);
  });
}

startServer().catch(console.error);
