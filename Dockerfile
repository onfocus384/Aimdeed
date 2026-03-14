# STAGE 1: Build & Dependencies
FROM node:20.19-alpine AS builder

WORKDIR /app

# Install build dependencies if needed (e.g., for native npm modules)
RUN apk add --no-cache python3 make g++

# Layer caching: Copy package files first
COPY package*.json ./
RUN npm install --omit=dev

# STAGE 2: Production Runtime
FROM node:20.19-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy only the necessary files from builder and project
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Security: Run as a non-root user
USER node

# Render dynamically assigns a PORT, but 10000 is their default
EXPOSE 10000

# Start command
CMD ["node", "app.js"]
