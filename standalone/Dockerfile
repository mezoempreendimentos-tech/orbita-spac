FROM node:22-slim
WORKDIR /app

# pnpm reads pnpm.patchedDependencies from package.json, which references
# patches/*.patch. We must copy the whole source tree (or at least package.json
# + pnpm-lock.yaml + patches/) before running pnpm install, otherwise the
# patch file is missing and install fails.
COPY . .

# Install deps. Cached unless package.json/pnpm-lock.yaml/patches change.
RUN npm install -g corepack@latest && corepack enable && corepack pnpm install --frozen-lockfile

# Build the app. Vite bundles the client; esbuild bundles the server.
ENV SELF_HOSTED=true VITE_AUTH_MODE=local
RUN corepack pnpm run build

ENV NODE_ENV=production

# Entrypoint baked into the image. The wait-for-db logic tolerates the
# drizzle-kit 0.31.10 spurious-exit-code bug and validates by database
# state (count of tables) rather than by exit code. See entrypoint.sh.
RUN chmod +x /app/standalone/entrypoint.sh
EXPOSE 8080
CMD ["sh", "/app/standalone/entrypoint.sh"]
