# Etapa de construcción - INSTALA TODAS las dependencias
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (INCLUYENDO devDependencies)
RUN npm install --legacy-peer-deps

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar todo el código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar lo necesario desde la etapa de construcción
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/db ./db
COPY --from=builder /app/next.config.ts ./

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=10000

# Exponer puerto (Render usa 10000)
EXPOSE 10000

# Comando para iniciar (usando standalone)
CMD ["node", "server.js"]