FROM node:20.19-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the code
COPY . .

# Security: Run as a non-root user
USER node

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "app.js"]
