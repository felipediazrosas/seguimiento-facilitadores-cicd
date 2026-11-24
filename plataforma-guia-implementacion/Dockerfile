# syntax=docker/dockerfile:1
# =============================================================================
# Imagen de la plataforma «Guía de estandarización y seguimiento de facilitadores»
# Basada en la skill 07 (plantilla Dockerfile.node), adaptada a esta aplicación:
#   · El servidor (server/server.js) no tiene dependencias de ejecución: el
#     runtime solo lleva Node.js y los archivos que el servidor publica.
#   · Etapa «test»: instala las devDependencies y ejecuta lint + pruebas.
#     Jenkins la usa (docker build --target test) para validar sin instalar Node
#     en el agente. No forma parte de la imagen final.
#   · Runtime sin npm/npx/corepack/yarn (lección de la referencia: el CVE CRITICAL
#     que bloqueaba su CI venía del npm de la imagen base).
#   · Código de solo lectura (propiedad de root), proceso como usuario «node»,
#     datos en el volumen /data (cifrados con DATA_KEY), HEALTHCHECK y labels OCI.
# =============================================================================
ARG NODE_VERSION=24

# ---- Etapa 1: validación (lint + pruebas automatizadas) ----
FROM node:${NODE_VERSION}-alpine AS test
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run lint && npm test

# ---- Etapa 2: runtime mínimo ----
FROM node:${NODE_VERSION}-alpine AS runtime
ARG APP_VERSION=dev
ARG VCS_REF=unknown
LABEL org.opencontainers.image.title="plataforma-guia" \
      org.opencontainers.image.description="Guía de estandarización y seguimiento de facilitadores · Unisabana e-Learning" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}"

ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data

# Quitar los gestores de paquetes del runtime (menor superficie de ataque y menos CVE)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg \
 && mkdir -p /data && chown node:node /data

WORKDIR /app
# Solo lo que el servidor sirve o ejecuta (sin pruebas, documentación ni configuración de desarrollo)
COPY index.html ./
COPY css/ ./css/
COPY js/ ./js/
COPY vendor/ ./vendor/
COPY server/ ./server/

USER node
EXPOSE 8080
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1

CMD ["node", "server/server.js"]
