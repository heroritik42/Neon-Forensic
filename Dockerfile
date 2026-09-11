# ==============================================================================
# NEON FORENSIC - Production Linux Container
# Multi-stage build with native ADB & USB platform tools
# ==============================================================================

FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime Image
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install Android Tools (ADB, Fastboot), USB utilities, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    android-tools-adb \
    android-tools-fastboot \
    usbutils \
    udev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

# Start NEON FORENSIC server
CMD ["node", "dist/server.cjs"]
