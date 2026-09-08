# Build stage.
# This stage deliberately KEEPS devDependencies, because the one-shot `migrate`
# service in docker-compose reuses it to run the Prisma CLI and tsx. Pruning
# happens in the separate `pruned` stage below, so the runtime image stays slim.
FROM node:current-alpine3.22 AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Pruning stage: strips devDependencies without stripping them from `builder`
FROM builder AS pruned
RUN npm prune --production

# Production stage
FROM node:current-alpine3.22

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=pruned /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Generate Prisma client in production image
RUN npx prisma generate

# Start the application
CMD ["node", "dist/server.js"]
