FROM node:22-slim
WORKDIR /app

# Build-time metadata. Defaults are "no-commit"/"unknown" so local builds
# still work; CI passes real values via `--build-arg`.
ARG GIT_COMMIT=no-commit
ARG BUILD_TIME=unknown
ENV GIT_COMMIT=${GIT_COMMIT} BUILD_TIME=${BUILD_TIME}

COPY . .

RUN npm install -g corepack@latest && corepack enable && corepack pnpm install --frozen-lockfile

ENV SELF_HOSTED=true VITE_AUTH_MODE=local
RUN corepack pnpm run build

ENV NODE_ENV=production

RUN chmod +x /app/standalone/entrypoint.sh
EXPOSE 8080
CMD ["sh", "/app/standalone/entrypoint.sh"]
