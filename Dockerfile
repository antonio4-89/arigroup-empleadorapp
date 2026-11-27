# syntax=docker/dockerfile:1
# Portal RH (empleador) servida con nginx.
#
#   docker build -t checador-empleador .
#   docker run --rm -p 8080:80 checador-empleador      →  http://localhost:8080

# ── 1. Compilación ─────────────────────────────────────────────
FROM node:24-alpine AS compilacion
WORKDIR /app

# Primero solo el package.json: las dependencias se reutilizan de la caché si no cambian.
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ── 2. Servidor ────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /app/www/ /usr/share/nginx/html/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/salud || exit 1
