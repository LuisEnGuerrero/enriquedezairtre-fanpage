# ============================================================
#  STAGE 1: Dependencias
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ============================================================
#  STAGE 2: Build
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================================
#  STAGE 3: Runner
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV PORT=8080

EXPOSE 8080
CMD ["./entrypoint.sh"]
