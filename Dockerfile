# =============================================================================
# Nomedia - Self-Hosted Production Docker Image
# =============================================================================
# Multi-stage build for optimized production image

# ================================
# Stage 1: Build the application
# ================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies (needed for native modules like bcrypt, sqlite3)
RUN apk add --no-cache python3 make g++ postgresql-client py3-setuptools

# Copy package files first (for better layer caching)
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY vite.config.server.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY public/ ./public/
COPY index.html ./

# Build the frontend
RUN npm run build

# Build the backend server
RUN npx vite build --config vite.config.server.ts

# ================================
# Stage 2: Production runtime
# ================================
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client \
    tzdata

# Set timezone (can be overridden with TZ environment variable)
ENV TZ=UTC

# Create app user for security (don't run as root)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nomedia -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder (already built with native binaries)
COPY --from=builder --chown=nomedia:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nomedia:nodejs /app/dist ./dist

# Copy server source files (needed for TypeScript imports)
COPY --chown=nomedia:nodejs server/ ./server/

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs /app/data && \
    chown -R nomedia:nodejs /app/uploads /app/logs /app/data && \
    chmod 755 /app/uploads /app/logs /app/data

# Create health check script
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'curl -f http://localhost:${PORT:-8000}/api/health || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Switch to non-root user
USER nomedia

# Environment defaults (can be overridden)
ENV NODE_ENV=production
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /healthcheck.sh

# Use dumb-init for proper signal handling (graceful shutdowns)
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server/node-build.mjs"]
