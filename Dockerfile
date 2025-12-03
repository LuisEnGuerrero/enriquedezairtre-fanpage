FROM node:20-alpine

WORKDIR /app

# Copiar primero los archivos esenciales
COPY package*.json ./
COPY prisma ./prisma/
COPY . .

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Generar Prisma Client
RUN npx prisma generate

# Build (que ahora incluye prisma generate)
RUN npm run build

# Variables
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# Comando para Render (standalone)
CMD ["node", ".next/standalone/server.js"]