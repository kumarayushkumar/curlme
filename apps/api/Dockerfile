# Build stage
FROM node:current-alpine3.22 AS builder

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm i

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

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
COPY --from=builder prisma ./prisma
COPY package*.json ./

# Install Prisma CLI globally for migrations
RUN npm install -g prisma

# Start the application
CMD ["node", "dist/server.js"]
