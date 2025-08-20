# Build stage
FROM node:current-alpine3.22 AS builder

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm i

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Production stage
FROM node:current-alpine3.22

WORKDIR /app

# Install system dependencies required by your app (if any)
RUN apk add --no-cache \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Copy built assets from builder stage
COPY --from=builder dist ./dist
COPY --from=builder node_modules ./node_modules
COPY package*.json ./

# Start the application
CMD ["node", "dist/server.js"]
