FROM node:22-slim
WORKDIR /app
COPY . .
ENV SELF_HOSTED=true VITE_AUTH_MODE=local
RUN npm install -g corepack@latest && corepack pnpm install --frozen-lockfile && corepack pnpm run build
ENV NODE_ENV=production
EXPOSE 8080
CMD ["sh", "standalone/entrypoint.sh"]
