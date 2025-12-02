FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install --only=production --legacy-peer-deps

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN npm run build

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=10000

# Exponer puerto (Render usa el puerto 10000)
EXPOSE 10000

# Comando para iniciar
CMD ["npm", "start"]