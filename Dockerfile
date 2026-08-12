# ---------- Stage 1: Build React SPA ----------
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# ---------- Stage 2: Backend + static SPA ----------
FROM node:22-alpine

WORKDIR /app

# Copy backend package files and install production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy the rest of the code
COPY backend/ ./backend/

# JOSAA dataset must be writable by the non-root runtime user (PUT /api/josaa)
RUN chown -R node:node /app/backend/data

# Copy the built SPA from the frontend build stage
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Security: Run as a non-root user
USER node

# Expose port
EXPOSE 3000

# Healthcheck: liveness + readiness against local Express server
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1

# Start command
WORKDIR /app/backend
CMD ["node", "server.js"]
