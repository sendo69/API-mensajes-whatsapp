# 1. Etapa de compilación
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# 2. Etapa de producción
FROM node:22-alpine

WORKDIR /app

# Copiar solo lo necesario desde la etapa de builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env ./ 

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Exponer el puerto configurado
EXPOSE 3000

# Comando para arrancar
CMD ["node", "dist/index.js"]
