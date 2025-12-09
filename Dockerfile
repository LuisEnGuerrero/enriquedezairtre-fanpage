# ============================================================
#  STAGE 1: Dependencias
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copiamos solo lo necesario para instalar deps
COPY package*.json ./

# Instalar dependencias (puedes cambiar a `npm ci` si tienes package-lock)
RUN npm install --legacy-peer-deps

# ============================================================
#  STAGE 2: Build de la app
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar el resto del código
COPY . .

# Build de Next.js (genera .next/standalone)
RUN npm run build

# ============================================================
#  STAGE 3: Runner (imagen final ligera)
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Render/contener usa esta variable, tu entrypoint la lee.
ENV PORT=10000

# Copiamos el resultado del build standalone
COPY --from=builder /app/.next/standalone ./ 
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copiamos scripts de Firestore (seed / reset)
COPY --from=builder /app/scripts ./scripts

# Copiamos el entrypoint (desde el contexto original)
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 10000

# Usamos entrypoint.sh (que se encarga de seed/reset + server)
CMD ["./entrypoint.sh"]
