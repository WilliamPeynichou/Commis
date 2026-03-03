FROM node:20-alpine
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install all workspace dependencies
RUN npm ci

# Copy source files
COPY shared/ ./shared/
COPY backend/ ./backend/

# Generate Prisma client (needed before tsc so Role enum and row types exist)
RUN cd backend && npx prisma generate

# Compile backend (shared types are import type → erased at compile time)
RUN cd backend && npx tsc

EXPOSE 3001

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node dist/index.js"]
