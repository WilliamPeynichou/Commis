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

# Compile backend (shared types are import type → erased at compile time)
RUN cd backend && npx tsc

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
