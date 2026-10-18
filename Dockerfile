# syntax=docker/dockerfile:1

# ---------- Build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Limite la mémoire du build : le VPS n'a que 4 Go, partagés avec Postgres et le portfolio
ENV NODE_OPTIONS=--max-old-space-size=1536
ENV NUXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Exécution ----------
# Seul le dossier .output est copié : Nitro y a déjà rassemblé les dépendances
# utiles (sharp compris, compilé pour Alpine dans l'étape de build).
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    UPLOAD_DIR=/data/uploads \
    NUXT_UPLOAD_DIR=/data/uploads \
    MIGRATIONS_DIR=/app/migrations

COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/server/db/migrations ./migrations

# Volume persistant des photos (à déclarer dans Coolify)
RUN mkdir -p /data/uploads && chown -R node:node /data
VOLUME /data/uploads

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
