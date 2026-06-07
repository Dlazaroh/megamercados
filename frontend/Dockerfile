# ─── MegaMercados Frontend - Dockerfile ──────────────────────────────────────
# Multi-stage build: Node para compilar, Nginx para servir

# Stage 1: Build React
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias primero (cache de capas)
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Variables de entorno de build
ARG REACT_APP_API_URL=http://localhost:8000/api/v1
ARG REACT_APP_STRIPE_PUBLIC_KEY
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_STRIPE_PUBLIC_KEY=$REACT_APP_STRIPE_PUBLIC_KEY

# Copiar código y compilar
COPY . .
RUN npm run build

# Stage 2: Nginx para servir
FROM nginx:1.25-alpine AS runtime

# Copiar build
COPY --from=builder /app/build /usr/share/nginx/html

# Configuración Nginx para SPA React
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
